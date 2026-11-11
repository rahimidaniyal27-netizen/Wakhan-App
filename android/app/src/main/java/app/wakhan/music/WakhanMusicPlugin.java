package app.wakhan.music;

import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import androidx.core.content.ContextCompat;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.session.MediaController;
import androidx.media3.session.SessionToken;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.common.util.concurrent.ListenableFuture;

@CapacitorPlugin(name = "WakhanMusic")
public class WakhanMusicPlugin extends Plugin {
    private MediaController controller;
    private ListenableFuture<MediaController> connecting;
    private String requestId = "";
    private volatile String desiredId = "";
    private boolean visible = true;
    private boolean destroyed = false;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable tick = new Runnable() {
        @Override public void run() {
            if (destroyed || !visible || controller == null) return;
            publish();
            handler.postDelayed(this, 1000);
        }
    };

    private interface Ready { void run(MediaController player); }
    private void ready(PluginCall call, Ready action) {
        getActivity().runOnUiThread(() -> {
            if (destroyed) { call.reject("PLAYER_UNAVAILABLE"); return; }
            if (controller != null) { action.run(controller); return; }
            if (connecting == null) {
                SessionToken token = new SessionToken(getContext(),
                    new ComponentName(getContext(), WakhanMusicService.class));
                connecting = new MediaController.Builder(getContext(), token).buildAsync();
            }
            ListenableFuture<MediaController> pending = connecting;
            pending.addListener(() -> {
                if (destroyed) { call.reject("PLAYER_UNAVAILABLE"); return; }
                if (pending != connecting) { call.reject("PLAYER_CANCELLED"); return; }
                try {
                    if (controller == null) {
                        controller = pending.get();
                        controller.addListener(new Player.Listener() {
                            @Override public void onEvents(Player player, Player.Events events) { publish(); }
                            @Override public void onPlayerError(PlaybackException error) {
                                JSObject value = snapshot();
                                value.put("error", "PLAYBACK_FAILED");
                                value.put("errorCode", error.errorCode);
                                notifyListeners("state", value);
                            }
                        });
                        handler.removeCallbacks(tick); tick.run();
                    }
                    action.run(controller);
                } catch (Exception error) {
                    connecting = null; call.reject("PLAYER_UNAVAILABLE");
                }
            }, ContextCompat.getMainExecutor(getContext()));
        });
    }

    private JSObject snapshot() {
        JSObject value = new JSObject();
        value.put("id", controller != null && controller.getCurrentMediaItem() != null
            ? controller.getCurrentMediaItem().mediaId : requestId);
        if (controller == null) { value.put("active", false); return value; }
        long duration = controller.getDuration();
        int state = controller.getPlaybackState();
        value.put("active", controller.getMediaItemCount() > 0 && state != Player.STATE_IDLE && state != Player.STATE_ENDED);
        value.put("ready", state == Player.STATE_READY);
        value.put("buffering", state == Player.STATE_BUFFERING);
        value.put("ended", state == Player.STATE_ENDED);
        value.put("playing", controller.isPlaying());
        value.put("wanted", controller.getPlayWhenReady());
        value.put("position", Math.max(0, controller.getCurrentPosition()) / 1000.0);
        value.put("duration", duration == C.TIME_UNSET ? 0 : Math.max(0, duration) / 1000.0);
        return value;
    }

    private void publish() {
        if (!destroyed && controller != null) notifyListeners("state", snapshot());
    }

    @PluginMethod public void loadTrack(PluginCall call) {
        String source = call.getString("source", "");
        String id = call.getString("id", "");
        Uri uri = Uri.parse(source);
        if (!"https".equals(uri.getScheme()) || !"music.kabulcafe.uk".equals(uri.getHost())
            || uri.getPort() != -1 || uri.getUserInfo() != null || uri.getFragment() != null
            || uri.getPath() == null || !uri.getPath().matches("/a/[A-Za-z0-9_-][A-Za-z0-9_.-]*")
            || !id.matches("[A-Za-z0-9_-]{1,64}")) {
            call.reject("INVALID_AUDIO_SOURCE"); return;
        }
        desiredId = id;
        ready(call, player -> {
            if (!id.equals(desiredId)) { call.resolve(); return; }
            requestId = id;
            MediaMetadata metadata = new MediaMetadata.Builder()
                .setTitle(call.getString("title", "Wakhan"))
                .setArtist(call.getString("artist", "")).build();
            player.setMediaItem(new MediaItem.Builder().setMediaId(id).setUri(uri).setMediaMetadata(metadata).build());
            player.seekTo((long)(Math.max(0, call.getDouble("position", 0.0)) * 1000));
            player.setPlayWhenReady(Boolean.TRUE.equals(call.getBoolean("playing", true)));
            player.prepare();
            publish(); call.resolve(snapshot());
        });
    }

    @PluginMethod public void control(PluginCall call) {
        String id = call.getString("id", "");
        String action = call.getString("action", "");
        if (action.equals("stop") && id.equals(desiredId)) desiredId = "";
        ready(call, player -> {
            if (!id.equals(requestId)) { call.resolve(); return; }
            switch (action) {
                case "play": player.play(); break;
                case "pause": player.pause(); break;
                case "seek": player.seekTo((long)(Math.max(0, call.getDouble("position", 0.0)) * 1000)); break;
                case "stop": player.stop(); player.clearMediaItems(); requestId = ""; break;
                default: call.reject("INVALID_PLAYER_ACTION"); return;
            }
            publish(); call.resolve(snapshot());
        });
    }

    @PluginMethod public void state(PluginCall call) {
        getActivity().runOnUiThread(() -> call.resolve(snapshot()));
    }

    @PluginMethod public void stopAll(PluginCall call) {
        desiredId = "";
        getActivity().runOnUiThread(() -> {
            if (controller != null) { controller.stop(); controller.clearMediaItems(); }
            requestId = "";
            getContext().stopService(new Intent(getContext(), WakhanMusicService.class));
            handler.removeCallbacks(tick);
            if (connecting != null) MediaController.releaseFuture(connecting);
            connecting = null; controller = null;
            call.resolve();
        });
    }

    @Override protected void handleOnPause() { visible = false; handler.removeCallbacks(tick); }
    @Override protected void handleOnResume() { visible = true; handler.removeCallbacks(tick); tick.run(); }
    @Override protected void handleOnDestroy() {
        destroyed = true; handler.removeCallbacksAndMessages(null);
        if (connecting != null) MediaController.releaseFuture(connecting);
        controller = null;
    }
}
