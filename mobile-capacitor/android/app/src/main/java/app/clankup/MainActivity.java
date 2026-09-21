package app.clankup;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/**
 * The shell, full screen: both system bars — the status bar up top and
 * the navigation bar (back / home / recents, or the gesture pill) below —
 * are hidden while the game is up, the way games do, so the console sits
 * on the top edge of the glass and the tab bar on the bottom one. A swipe
 * from either edge brings the bars back for a moment ("sticky immersive")
 * and they hide themselves again — the player never loses the way out.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // The bar comes back on its own after a dialog, a permission prompt
        // or a trip through the app switcher; hide it again on every return.
        if (hasFocus) hideSystemBars();
    }

    private void hideSystemBars() {
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }
}
