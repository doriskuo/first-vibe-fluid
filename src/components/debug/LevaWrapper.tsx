'use client'

import { Leva } from 'leva'

export default function LevaWrapper() {
    // 只在開發環境顯示
    const isDev = process.env.NODE_ENV === 'development'

    return (
        <Leva
            hidden={!isDev}
            collapsed={false}
            oneLineLabels={false}
            flat={false}
        />
    )
}
