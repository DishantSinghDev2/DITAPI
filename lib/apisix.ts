import axios from "axios"

const apisixClient = axios.create({
  baseURL: process.env.APISIX_API_URL || "http://apisix-admin:9180",
  headers: {
    "X-API-KEY": process.env.APISIX_API_KEY,
  },
})

export interface ApisixRoute {
  uri: string
  methods: string[]
  upstream: {
    type: "roundrobin" | "chash"
    nodes: Record<string, number>
  }
  plugins?: Record<string, any>
}

export interface ApisixUpstream {
  nodes: Record<string, number>
  type: "roundrobin" | "chash"
}

export const apisixService = {
  // Create or update a route
  async createRoute(routeId: string, route: ApisixRoute) {
    try {
      const response = await apisixClient.put(`/apisix/admin/routes/${routeId}`, {
        ...route,
        id: routeId,
      })
      return response.data
    } catch (error) {
      console.error("APISIX Error creating route:", error)
      throw error
    }
  },

  // Delete a route
  async deleteRoute(routeId: string) {
    try {
      await apisixClient.delete(`/apisix/admin/routes/${routeId}`)
    } catch (error) {
      console.error("APISIX Error deleting route:", error)
      throw error
    }
  },

  // Create upstream (pool of backend servers)
  async createUpstream(upstreamId: string, upstream: ApisixUpstream) {
    try {
      const response = await apisixClient.put(`/apisix/admin/upstreams/${upstreamId}`, {
        ...upstream,
        id: upstreamId,
      })
      return response.data
    } catch (error) {
      console.error("APISIX Error creating upstream:", error)
      throw error
    }
  },

  // Get route details
  async getRoute(routeId: string) {
    try {
      const response = await apisixClient.get(`/apisix/admin/routes/${routeId}`)
      return response.data.node.value
    } catch (error) {
      console.error("APISIX Error getting route:", error)
      return null
    }
  },
}
