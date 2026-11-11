package app.wakhan.music;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;

public class WakhanAudioSessionService extends Service {
    static volatile boolean running = false;
    static volatile boolean microphone = false;
    private static final String CHANNEL = "wakhan-playback";
    private static final String STOP = "app.wakhan.music.STOP_AUDIO";
    private static final int ID = 2601;
    private PowerManager.WakeLock wake;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable renew = new Runnable() {
        @Override public void run() {
            if (!running) return;
            if (wake != null) wake.acquire(15 * 60 * 1000L);
            handler.postDelayed(this, 10 * 60 * 1000L);
        }
    };

    @Override public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, "Wakhan playback", NotificationManager.IMPORTANCE_LOW);
            channel.setSound(null, null);
            channel.setDescription("پخش موسیقی و صدای سالون واخان");
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
        PowerManager power = (PowerManager) getSystemService(POWER_SERVICE);
        wake = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Wakhan:ActiveAudio");
        wake.setReferenceCounted(false);
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) { stopSelf(); return START_NOT_STICKY; }
        if (STOP.equals(intent.getAction())) {
            WakhanAudioSessionPlugin.stopPlayback();
            stopSelf();
            return START_NOT_STICKY;
        }
        boolean wantsMic = intent.getBooleanExtra("microphone", false);
        boolean hall = intent.getBooleanExtra("hall", false);
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (open == null) { stopSelf(); return START_NOT_STICKY; }
        PendingIntent content = PendingIntent.getActivity(this, ID, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent stop = new Intent(this, WakhanAudioSessionService.class).setAction(STOP);
        PendingIntent stopAction = PendingIntent.getService(this, ID + 1, stop, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification notification = new NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("واخان")
            .setContentText(hall ? (wantsMic ? "میکروفون سالون روشن است" : "متصل به صدای سالون") : "پخش موسیقی")
            .setContentIntent(content)
            .setOngoing(true)
            .setSilent(true)
            .setOnlyAlertOnce(true)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "قطع پخش و صدا", stopAction)
            .build();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                int type = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK;
                if (wantsMic && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) type |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
                startForeground(ID, notification, type);
            } else startForeground(ID, notification);
            running = true;
            microphone = wantsMic;
            handler.removeCallbacks(renew);
            renew.run();
        } catch (RuntimeException error) {
            WakhanAudioSessionPlugin.unavailable();
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    @Override public void onDestroy() {
        running = false;
        microphone = false;
        handler.removeCallbacks(renew);
        if (wake != null && wake.isHeld()) wake.release();
        stopForeground(true);
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}
