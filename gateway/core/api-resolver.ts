import type { GatewayConfig } from "./gateway-config"
import type { GatewayLogger } from "./gateway-logger"
import { getApiBySlug, getApiBySubdomain } from "@/lib/database/api-queries"
import type { API } from "@/types/database"

export class ApiResolver {
  private config: GatewayConfig
  private logger: GatewayLogger

  constructor(config: GatewayConfig, logger: GatewayLogger) {
    this.config = config
    this.logger = logger
  }

  public async resolveApi(subdomain: string, path: string): Promise<API | null> {
    this.logger.log(`Attempting to resolve API for subdomain: ${subdomain}, path: ${path}`)

    let api: API | null = null

    // 1. Try to resolve by subdomain if it's not the base domain
    if (
      subdomain &&
      subdomain !== "www" &&
      subdomain !== "api" &&
      subdomain !== new URL(this.config.gatewayBasePath).hostname.split(".")[0]
    ) {
      api = await getApiBySubdomain(subdomain)
      if (api) {
        this.logger.log(`API resolved by subdomain: ${api.name}`)
        return api
      }
    }

    // 2. Try to resolve by path if subdomain resolution failed or was not applicable
    // Assuming path format like /api/{apiSlug}/...
    const pathSegments = path.split("/").filter(Boolean)
    if (pathSegments.length > 1 && pathSegments[0] === "api") {
      const apiSlug = pathSegments[1]
      api = await getApiBySlug(apiSlug)
      if (api) {
        this.logger.log(`API resolved by path slug: ${api.name}`)
        return api
      }
    }

    this.logger.warn(`No API found for subdomain: ${subdomain} and path: ${path}`)
    return null
  }
}
