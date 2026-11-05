#import <Cocoa/Cocoa.h>

// Native launcher for environments where AppleScript additions are unavailable.
int main(void) {
  @autoreleasepool {
    [NSApplication sharedApplication];
    [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];
    NSString *resources = [[NSBundle mainBundle] resourcePath];
    NSError *error = nil;
    NSString *node = [NSString stringWithContentsOfFile:[resources stringByAppendingPathComponent:@"node-path.txt"] encoding:NSUTF8StringEncoding error:&error];
    NSString *message = nil;
    if (!node || ![[NSFileManager defaultManager] isExecutableFileAtPath:node]) {
      message = @"找不到建置時的 Node.js，請重新建置啟動器。";
    } else {
      NSTask *task = [[NSTask alloc] init];
      task.executableURL = [NSURL fileURLWithPath:node];
      task.arguments = @[[resources stringByAppendingPathComponent:@"engine/macos-skin.mjs"]];
      NSPipe *output = [NSPipe pipe];
      task.standardOutput = [NSFileHandle fileHandleWithNullDevice];
      task.standardError = output;
      if (![task launchAndReturnError:&error]) {
        message = [error localizedDescription];
      } else {
        // Drain while running so a full pipe cannot block Node.
        NSData *data = [[output fileHandleForReading] readDataToEndOfFile];
        [task waitUntilExit];
        if (task.terminationStatus != 0) {
          NSString *details = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
          message = details.length ? [details substringFromIndex:details.length > 4000 ? details.length - 4000 : 0] : @"載入器未能完成，請從終端執行以檢查錯誤。";
        }
      }
    }
    if (message) {
      NSAlert *alert = [[NSAlert alloc] init];
      alert.messageText = @"桑多涅 ChatGPT 啟動失敗";
      alert.informativeText = message;
      [alert addButtonWithTitle:@"知道了"];
      [NSApp activateIgnoringOtherApps:YES];
      [alert runModal];
      return 1;
    }
  }
  return 0;
}
