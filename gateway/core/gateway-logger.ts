export class GatewayLogger {
  private logLevel: "debug" | "info" | "warn" | "error" | "none"

  constructor(logLevel: "debug" | "info" | "warn" | "error" | "none" = "info") {
    this.logLevel = logLevel
  }

  private shouldLog(level: "debug" | "info" | "warn" | "error"): boolean {
    const levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      none: 4,
    }
    return levels[level] >= levels[this.logLevel]
  }

  public debug(message: string, ...args: any[]): void {
    if (this.shouldLog("debug")) {
      console.debug(`[GATEWAY DEBUG] ${message}`, ...args)
    }
  }

  public log(message: string, ...args: any[]): void {
    if (this.shouldLog("info")) {
      console.log(`[GATEWAY INFO] ${message}`, ...args)
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (this.shouldLog("warn")) {
      console.warn(`[GATEWAY WARN] ${message}`, ...args)
    }
  }

  public error(message: string, ...args: any[]): void {
    if (this.shouldLog("error")) {
      console.error(`[GATEWAY ERROR] ${message}`, ...args)
    }
  }
}
