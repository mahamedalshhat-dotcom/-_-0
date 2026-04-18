import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes, Madhab } from 'adhan';
import { format } from 'date-fns';

export function getPrayerTimes(
  lat: number, 
  lng: number, 
  date: Date = new Date(), 
  method: string = 'MuslimWorldLeague',
  madhab: string = 'Shafi'
) {
  const coordinates = new Coordinates(lat, lng);
  
  // @ts-ignore - Dynamic method selection
  const params = CalculationMethod[method] ? CalculationMethod[method]() : CalculationMethod.MuslimWorldLeague();
  
  if (madhab === 'Hanafi') {
    params.madhab = Madhab.Hanafi;
  } else {
    params.madhab = Madhab.Shafi;
  }

  const prayerTimes = new PrayerTimes(coordinates, date, params);
  const sunnahTimes = new SunnahTimes(prayerTimes);

  let nextPrayer = prayerTimes.nextPrayer();
  let nextPrayerTime = prayerTimes.timeForPrayer(nextPrayer);

  // If next prayer is none, it means Isha has passed for today.
  // We should look for tomorrow's Fajr.
  if (nextPrayer === 'none' || !nextPrayerTime) {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = new PrayerTimes(coordinates, tomorrow, params);
    nextPrayer = 'fajr';
    nextPrayerTime = tomorrowTimes.fajr;
  }

  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
    middleOfTheNight: sunnahTimes.middleOfTheNight,
    lastThirdOfTheNight: sunnahTimes.lastThirdOfTheNight,
    current: prayerTimes.currentPrayer(),
    next: nextPrayer,
    nextTime: nextPrayerTime,
  };
}

export function formatTime(date: Date | null | undefined) {
  if (!date || isNaN(date.getTime())) {
    return '--:--';
  }
  return format(date, 'hh:mm a');
}
