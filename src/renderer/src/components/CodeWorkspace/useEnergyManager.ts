import { useState, useEffect } from 'react'

export function useEnergyManager() {
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
    const [isCharging, setIsCharging] = useState<boolean | null>(null)
    const [lowPowerMode, setLowPowerMode] = useState(false)

    useEffect(() => {
        if (!('getBattery' in navigator)) return

        let battery: any = null

        const updateStatus = () => {
            setBatteryLevel(battery.level * 100)
            setIsCharging(battery.charging)
            // Enable Low Power Mode if battery < 20% and not charging
            setLowPowerMode(battery.level < 0.2 && !battery.charging)
        }

        (navigator as any).getBattery().then((batt: any) => {
            battery = batt
            updateStatus()

            battery.addEventListener('levelchange', updateStatus)
            battery.addEventListener('chargingchange', updateStatus)
        })

        return () => {
            if (battery) {
                battery.removeEventListener('levelchange', updateStatus)
                battery.removeEventListener('chargingchange', updateStatus)
            }
        }
    }, [])

    return { batteryLevel, isCharging, lowPowerMode }
}
