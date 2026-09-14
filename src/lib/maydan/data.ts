export type Team = { id: string; name: string; ar: string; short: string; color: string; city: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; form: string[]; recruiting?: string };
export const teams: Team[] = [
  { id: 'balata', name: 'Balata Athletic', ar: 'بلاطة الرياضي', short: 'BA', color: '#244d84', city: 'Nablus', played: 5, won: 4, drawn: 1, lost: 0, gf: 16, ga: 6, form: ['W','W','D','W','W'], recruiting: 'Goalkeeper' },
  { id: 'jenin', name: 'Jenin United', ar: 'جنين يونايتد', short: 'JU', color: '#245a47', city: 'Jenin', played: 5, won: 3, drawn: 1, lost: 1, gf: 14, ga: 8, form: ['W','D','L','W','W'], recruiting: 'Defender' },
  { id: 'shabab', name: 'Shabab Jenin', ar: 'شباب جنين', short: 'SJ', color: '#b46535', city: 'Jenin', played: 5, won: 3, drawn: 0, lost: 2, gf: 12, ga: 9, form: ['W','L','W','L','W'], recruiting: 'Midfielder' },
  { id: 'qalqilya', name: 'Qalqilya FC', ar: 'قلقيلية', short: 'QF', color: '#8a4050', city: 'Qalqilya', played: 5, won: 2, drawn: 2, lost: 1, gf: 10, ga: 8, form: ['D','W','W','D','L'] },
  { id: 'ittihad', name: 'Al Ittihad', ar: 'الاتحاد', short: 'AI', color: '#726137', city: 'Jenin', played: 5, won: 2, drawn: 0, lost: 3, gf: 9, ga: 12, form: ['L','W','L','W','L'], recruiting: 'Forward' },
  { id: 'nablus', name: 'Nablus City', ar: 'نابلس سيتي', short: 'NC', color: '#63528b', city: 'Nablus', played: 5, won: 1, drawn: 2, lost: 2, gf: 8, ga: 10, form: ['D','L','W','L','D'] },
  { id: 'yabad', name: 'Ya’bad SC', ar: 'يعبد الرياضي', short: 'YS', color: '#4c6e7b', city: 'Jenin', played: 5, won: 1, drawn: 1, lost: 3, gf: 6, ga: 12, form: ['L','D','L','W','L'] },
  { id: 'tubas', name: 'Tubas FC', ar: 'طوباس', short: 'TF', color: '#845f45', city: 'Tubas', played: 5, won: 0, drawn: 1, lost: 4, gf: 4, ga: 14, form: ['L','L','D','L','L'] },
];
export type Player = { id: string; name: string; ar: string; number: number; position: string; goals: number; assists: number; available: boolean; city: string };
export const players: Player[] = [
  { id: 'ahmad', name: 'Ahmad Darwish', ar: 'أحمد درويش', number: 10, position: 'Midfielder', goals: 4, assists: 6, available: true, city: 'Jenin' },
  { id: 'omar', name: 'Omar Khalil', ar: 'عمر خليل', number: 9, position: 'Forward', goals: 7, assists: 2, available: true, city: 'Jenin' },
  { id: 'yazan', name: 'Yazan Nasser', ar: 'يزن ناصر', number: 7, position: 'Forward', goals: 3, assists: 4, available: true, city: 'Nablus' },
  { id: 'mahmoud', name: 'Mahmoud Saleh', ar: 'محمود صالح', number: 1, position: 'Goalkeeper', goals: 0, assists: 0, available: true, city: 'Jenin' },
  { id: 'khaled', name: 'Khaled Hamdan', ar: 'خالد حمدان', number: 4, position: 'Defender', goals: 0, assists: 1, available: true, city: 'Jenin' },
  { id: 'anas', name: 'Anas Abu Omar', ar: 'أنس أبو عمر', number: 6, position: 'Midfielder', goals: 0, assists: 2, available: true, city: 'Jenin' },
  { id: 'tariq', name: 'Tariq Zaid', ar: 'طارق زيد', number: 3, position: 'Defender', goals: 0, assists: 0, available: true, city: 'Jenin' },
  { id: 'sami', name: 'Sami Odeh', ar: 'سامي عودة', number: 11, position: 'Forward', goals: 0, assists: 1, available: false, city: 'Nablus' },
  { id: 'mohammad', name: 'Mohammad Ali', ar: 'محمد علي', number: 8, position: 'Midfielder', goals: 0, assists: 1, available: false, city: 'Jenin' },
];
export type League = { id: string; name: string; ar: string; city: string; format: string; playersPerSide: number; minRoster: number; maxRoster: number; capacity: number; registered: number; fee: number; deposit: number; currency: string; status: 'Active' | 'Registration open' | 'Completed'; start: string; end: string; duration: number; rounds: number; winPoints: number };
export const leagues: League[] = [
  { id: 'jenin-autumn', name: 'Jenin Autumn League', ar: 'دوري جنين الخريفي', city: 'Jenin', format: 'Single round robin', playersPerSide: 7, minRoster: 7, maxRoster: 15, capacity: 8, registered: 8, fee: 1075, deposit: 200, currency: 'ILS', status: 'Active', start: '2026-08-14', end: '2026-10-02', duration: 60, rounds: 1, winPoints: 3 },
  { id: 'friday-nights', name: 'Friday Night Football', ar: 'دوري ليالي الجمعة', city: 'Jenin', format: 'Single round robin', playersPerSide: 5, minRoster: 5, maxRoster: 10, capacity: 6, registered: 4, fee: 750, deposit: 150, currency: 'ILS', status: 'Registration open', start: '2026-10-09', end: '2026-11-13', duration: 50, rounds: 1, winPoints: 3 },
  { id: 'nablus-cup', name: 'Nablus Community League', ar: 'دوري نابلس المجتمعي', city: 'Nablus', format: 'Double round robin', playersPerSide: 7, minRoster: 7, maxRoster: 14, capacity: 10, registered: 7, fee: 1400, deposit: 300, currency: 'ILS', status: 'Registration open', start: '2026-10-16', end: '2027-02-19', duration: 60, rounds: 2, winPoints: 3 },
];
export type Match = { id: string; home: string; away: string; date: string; time: string; venue: string; round: number; score?: [number, number]; status: 'Confirmed' | 'Full time' | 'Awaiting result' };
export const matches: Match[] = [
  { id: 'm6', home: 'jenin', away: 'shabab', date: '2026-09-18', time: '20:00', venue: 'Al Baladi Stadium', round: 6, status: 'Confirmed' },
  { id: 'm7', home: 'balata', away: 'qalqilya', date: '2026-09-18', time: '19:00', venue: 'Al Baladi Stadium', round: 6, status: 'Confirmed' },
  { id: 'm8', home: 'ittihad', away: 'nablus', date: '2026-09-19', time: '19:00', venue: 'Al Amal Sports Center', round: 6, status: 'Confirmed' },
  { id: 'm9', home: 'yabad', away: 'tubas', date: '2026-09-19', time: '20:00', venue: 'Al Amal Sports Center', round: 6, status: 'Confirmed' },
  { id: 'm5', home: 'jenin', away: 'ittihad', date: '2026-09-11', time: '20:00', venue: 'Al Baladi Stadium', round: 5, score: [3,1], status: 'Full time' },
  { id: 'm4', home: 'nablus', away: 'jenin', date: '2026-09-04', time: '19:00', venue: 'Al Amal Sports Center', round: 4, score: [0,2], status: 'Full time' },
];
export const venues = [
  { id: 'baladi', name: 'Al Baladi Stadium', ar: 'ملعب البلدية', city: 'Jenin', address: 'Haifa Street, Jenin', surface: 'Artificial turf', capacity: '5–9 a side', rate: 100, image: '/images/pitch.jpg', amenities: ['Floodlights', 'Changing rooms', 'Parking', 'Drinking water'] },
  { id: 'amal', name: 'Al Amal Sports Center', ar: 'مركز الأمل الرياضي', city: 'Jenin', address: 'Al Basateen, Jenin', surface: 'Artificial turf', capacity: '5–7 a side', rate: 90, image: '/images/venue.jpg', amenities: ['Floodlights', 'Parking', 'Café'] },
];
export const invoices = [
  { id: 'INV-026', label: 'Matchweek 6', amount: 125, date: '2026-09-18', status: 'Due' },
  { id: 'INV-022', label: 'Matchweek 5', amount: 125, date: '2026-09-11', status: 'Paid' },
  { id: 'INV-018', label: 'Matchweek 4', amount: 125, date: '2026-09-04', status: 'Paid' },
  { id: 'INV-001', label: 'Season deposit', amount: 200, date: '2026-08-07', status: 'Paid' },
];
export const initialNotifications = [
  { id: 'n1', title: 'Friday is confirmed.', ar: 'مباراة الجمعة مؤكدة.', body: 'Jenin United vs Shabab Jenin. Al Baladi Stadium, 20:00. Let your captain know you’re in.', href: '/hub/matches/m6', time: '2 hours ago', icon: 'calendar' },
  { id: 'n2', title: 'Three points in the bag.', ar: 'ثلاث نقاط في رصيدكم.', body: 'Your 3–1 win over Al Ittihad has been confirmed. The table is updated.', href: '/hub/matches/m5', time: 'Yesterday', icon: 'trophy' },
  { id: 'n3', title: 'Matchweek 6 payment', ar: 'دفعة الجولة السادسة', body: 'Your team’s ₪125 installment is due on 18 September. Cash and bank transfer are available.', href: '/hub/payments', time: 'Yesterday', icon: 'wallet' },
];
export function money(amount: number, currency = 'ILS', locale = 'en') { return new Intl.NumberFormat(locale === 'ar' ? 'ar-PS' : 'en-IL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount); }
export function teamById(id: string) { return teams.find(t => t.id === id) ?? teams[1]; }
export function dateLabel(date: string, locale = 'en', options?: Intl.DateTimeFormatOptions) { return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-PS' : 'en-GB', options ?? { day: 'numeric', month: 'short' }).format(new Date(date + 'T12:00:00')); }
