export const rankingService = {
  async generate(reportDate: string) {
    return {
      reportDate,
      summary: {
        yixinTotalRevenue: 1000000,
        minshiTotalRevenue: 500000,
        companyTotalRevenue: 50000,
        allTotalRevenue: 1550000,
      },
      rankings: [
        {
          rankNo: 1,
          employeeName: '李玲玲',
          totalFollowupCount: 15,
          totalFollowupAmount: 300000,
          totalRevenueAmount: 450000,
          totalActualAmount: 450000,
        },
        {
          rankNo: 2,
          employeeName: '王大明',
          totalFollowupCount: 10,
          totalFollowupAmount: 150000,
          totalRevenueAmount: 280000,
          totalActualAmount: 280000,
        }
      ]
    };
  }
};
