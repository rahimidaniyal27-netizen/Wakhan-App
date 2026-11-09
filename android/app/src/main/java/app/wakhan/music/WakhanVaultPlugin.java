package app.wakhan.music;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "WakhanVault")
public class WakhanVaultPlugin extends Plugin {
    private static final String ALIAS = "wakhan.native.session.v1";
    private boolean allowed(String key) { return "session".equals(key) || "pair".equals(key) || "server".equals(key); }
    private SharedPreferences preferences() { return getContext().getSharedPreferences("wakhan_native_vault", Context.MODE_PRIVATE); }
    private synchronized SecretKey secret() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        if (store.containsAlias(ALIAS)) return ((KeyStore.SecretKeyEntry) store.getEntry(ALIAS, null)).getSecretKey();
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
        return generator.generateKey();
    }
    @PluginMethod public void get(PluginCall call) {
        String key = call.getString("key"); if (!allowed(key)) { call.reject("Invalid storage key"); return; }
        String encoded = preferences().getString(key, null); JSObject result = new JSObject();
        if (encoded == null) { result.put("value", JSObject.NULL); call.resolve(result); return; }
        try {
            byte[] stored = Base64.decode(encoded, Base64.NO_WRAP);
            if (stored.length < 29) throw new IllegalStateException("Invalid ciphertext");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, secret(), new GCMParameterSpec(128, Arrays.copyOfRange(stored, 0, 12)));
            cipher.updateAAD(key.getBytes(StandardCharsets.UTF_8));
            result.put("value", new String(cipher.doFinal(Arrays.copyOfRange(stored, 12, stored.length)), StandardCharsets.UTF_8)); call.resolve(result);
        } catch (Exception error) { preferences().edit().remove(key).commit(); call.reject("Secure session could not be read", "VAULT_UNAVAILABLE"); }
    }
    @PluginMethod public void set(PluginCall call) {
        String key = call.getString("key"), value = call.getString("value");
        if (!allowed(key) || value == null || value.length() > 16384) { call.reject("Invalid storage value"); return; }
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, secret());
            cipher.updateAAD(key.getBytes(StandardCharsets.UTF_8)); byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)), iv = cipher.getIV();
            byte[] output = new byte[iv.length + encrypted.length]; System.arraycopy(iv, 0, output, 0, iv.length); System.arraycopy(encrypted, 0, output, iv.length, encrypted.length);
            if (!preferences().edit().putString(key, Base64.encodeToString(output, Base64.NO_WRAP)).commit()) throw new IllegalStateException("Storage write failed");
            call.resolve();
        } catch (Exception error) { call.reject("Secure session could not be saved", "VAULT_UNAVAILABLE"); }
    }
    @PluginMethod public void remove(PluginCall call) {
        String key = call.getString("key"); if (!allowed(key)) { call.reject("Invalid storage key"); return; }
        if (!preferences().edit().remove(key).commit()) { call.reject("Secure session could not be removed"); return; } call.resolve();
    }
}
