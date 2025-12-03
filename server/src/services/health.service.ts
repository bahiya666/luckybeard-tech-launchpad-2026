export const healthService = {
  getStatus() {
    return {
      ok: true,
      message: "API is healthy 🚀",
      timestamp: new Date(),
    };
  },
};
