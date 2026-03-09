export const reportService = {
  async createReport(payload: any) {
    return { id: Math.floor(Math.random() * 1000) };
  },
  async runParse(id: number, payload: any) {
    return { success: true };
  },
  async getParseResult(id: number) {
    return {
      totals: {
        totalCalls: 100,
        assignedDealsCount: 10,
        followupDealsCount: 5,
        closingRatePercent: 15,
        followupAmount: 50000,
        cancelledReturnAmount: 0,
        totalRevenueAmount: 50000,
      },
      details: [
        {
          id: 1,
          employeeName: '測試員',
          normalizedName: '測試員',
          identityTag: '一般',
          totalCalls: 50,
          assignedDealsCount: 5,
          followupDealsCount: 2,
          closingRatePercent: 14,
          followupAmount: 20000,
          cancelledReturnAmount: 0,
          totalRevenueAmount: 20000,
        }
      ]
    };
  },
  async updateTotals(id: number, payload: any) {
    return { success: true };
  },
  async updateDetail(id: number, payload: any) {
    return { success: true };
  }
};
