import type { GatewayLogger } from "./gateway-logger"
import type { GatewayResponse } from "@/types/gateway"

export class ResponseProcessor {
  private logger: GatewayLogger

  constructor(logger: GatewayLogger) {
    this.logger = logger
  }

  public async process(response: Response): Promise<GatewayResponse> {
    this.logger.log(`Processing incoming response with status: ${response.status}`)

    const headers = new Headers(response.headers)

    // Remove sensitive or hop-by-hop headers that should not be passed back to the client
    headers.delete("set-cookie") // Cookies should be handled carefully or proxied explicitly
    headers.delete("transfer-encoding") // Handled by the HTTP server
    headers.delete("connection") // Hop-by-hop header
    headers.delete("keep-alive") // Hop-by-hop header
    headers.delete("proxy-authenticate")
    headers.delete("proxy-authorization")
    headers.delete("te")
    headers.delete("trailers")
    headers.delete("upgrade")

    // Modify or add headers as needed
    headers.set("X-Gateway-Processed", "true")
    headers.set("Access-Control-Allow-Origin", "*") // Example: Enable CORS for all origins
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")

    let body: string | null = null
    try {
      // Attempt to read body as text, assuming most API responses are text-based (JSON, XML, etc.)
      // If the content-type is binary (e.g., image), this might fail or return garbage.
      // A more robust solution would inspect Content-Type header.
      body = await response.text()
    } catch (e) {
      this.logger.warn("Could not read response body as text. It might be binary or empty.")
      body = null
    }

    return {
      status: response.status,
      headers: Object.fromEntries(headers.entries()),
      body: body,
    }
  }
}
