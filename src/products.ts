import { Plan } from "./types";

export default [
  {
    product: {
      id: 'MA-PREM-BASIC',
      name: 'Premium Cơ Bản',
      description: 'Đây là gói premium cơ bản nhất của Minato Aqua mà bạn có thể đăng kí. Chỉ bao gồm những tính năng: tự động phát bài hát tiếp theo, tua tới 1 thời gian nhất định trong bài hát,...',
      type: 'DIGITAL'
    },
    plan: {
      product_id: 'MA-PREM-BASIC',
      name: 'Premium Cơ Bản',
      billing_cycles: [
        {
          tenure_type: 'TRIAL',
          frequency: {
            interval_unit: 'WEEK',
            interval_count: 1,
          },
          total_cycles: 1,
          sequence: 1,
        },
        {
          tenure_type: 'REGULAR',
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1,
          },
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              currency_code: 'USD',
              value: '1.99'
            }
          },
          sequence: 2,
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    } as Plan
  },
  {
    product: {
      id: 'MA-PREM-ADVANCED',
      name: 'Premium Nâng Cấp',
      description: 'Đây là gói premium nâng cấp của Minato Aqua. Các tính năng có trong premium này bao gồm phát các video trên nền tăng YouTube, tạo các danh sách phát theo tuỳ ý'
    },
    plan: {} as Plan,
  }
]