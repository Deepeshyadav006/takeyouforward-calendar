'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths,
  isToday,
  getMonth,
  getDay,
  differenceInDays,
} from 'date-fns'
import confetti from 'canvas-confetti'

type SeasonConfig = {
  name: string
  nameHindi: string
  months: number[]
  accent: string
  accentLight: string
  bg: string
  image: string
  description: string
}

const SEASONS: SeasonConfig[] = [
  { name: 'Winter', nameHindi: 'Shishir', months: [1, 2], accent: '#378ADD', accentLight: '#e6f1fb', bg: '#f0f4f8', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800', description: 'Foggy & cold' },
  { name: 'Spring', nameHindi: 'Vasant', months: [3, 4], accent: '#3B6D11', accentLight: '#eaf3de', bg: '#f0faf0', image: 'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=800', description: 'Flowers blooming' },
  { name: 'Summer', nameHindi: 'Grishma', months: [5, 6], accent: '#BA7517', accentLight: '#faeeda', bg: '#fffaf0', image: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800', description: 'Hot sun' },
  { name: 'Monsoon', nameHindi: 'Varsha', months: [7, 8], accent: '#0F6E56', accentLight: '#e1f5ee', bg: '#f0faf7', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800', description: 'Rain & clouds' },
  { name: 'Autumn', nameHindi: 'Sharad', months: [9, 10], accent: '#D85A30', accentLight: '#faece7', bg: '#fff8f5', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', description: 'Golden skies' },
  { name: 'Pre-winter', nameHindi: 'Hemant', months: [11, 12], accent: '#993556', accentLight: '#fbeaf0', bg: '#fdf5f8', image: 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=800', description: 'Harvest season' },
]

const getSeason = (month: number): SeasonConfig => {
  return SEASONS.find(s => s.months.includes(month)) ?? SEASONS[1]
}

const INDIAN_HOLIDAYS = [
  { date: '2026-01-26', name: 'Republic Day' },
  { date: '2026-03-21', name: 'Holi' },
  { date: '2026-04-06', name: 'Ram Navami' },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-03-31', name: 'Eid' },
  { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-10-20', name: 'Diwali' },
  { date: '2026-12-25', name: 'Christmas' },
]

const STICKERS = ['🔥', '📚', '🎉', '💀', '💪', '✈️', '🎵', '❤️']
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Calendar() {
  const [displayDate, setDisplayDate] = useState(new Date())
  const [direction, setDirection] = useState(0)
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null })
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [stickers, setStickers] = useState<Record<string, string>>({})
  const [currentNote, setCurrentNote] = useState('')
  const [showStickerPicker, setShowStickerPicker] = useState<Date | null>(null)
  const [isEveningMode, setIsEveningMode] = useState(false)
  const [showSavedIndicator, setShowSavedIndicator] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springConfig = { stiffness: 150, damping: 20 }
  const rotateX = useSpring(useTransform(y, [-300, 300], [6, -6]))
  const rotateY = useSpring(useTransform(x, [-300, 300], [-6, 6]))

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640

  const season = useMemo(() => getSeason(getMonth(displayDate) + 1), [displayDate])
  const today = new Date()

  const isEvening = useMemo(() => {
    const hour = new Date().getHours()
    return hour >= 19 || hour < 6
  }, [])

  useEffect(() => {
    if (isEvening !== isEveningMode) setIsEveningMode(isEvening)
  }, [isEvening])

  const darkTheme = isEveningMode ? ({
    cardBg: '#2a2118',
    text: '#f5e6c8',
    accentText: '#f5e6c8',
    muted: '#a89070',
    bg: '#1a1610',
    border: 'rgba(200, 180, 140, 0.2)',
  }) : ({
    cardBg: '#ffffff',
    text: '#1f2937',
    accentText: season.accent,
    muted: '#6b7280',
    bg: '#f5f0e8',
    border: '#e5e7eb',
  })

  useEffect(() => {
    const storedNotes = localStorage.getItem('calendar-notes')
    if (storedNotes) setNotes(JSON.parse(storedNotes))
    const storedStickers = localStorage.getItem('calendar-stickers')
    if (storedStickers) setStickers(JSON.parse(storedStickers))
  }, [])

  useEffect(() => {
    if (Object.keys(notes).length > 0) localStorage.setItem('calendar-notes', JSON.stringify(notes))
    if (Object.keys(stickers).length > 0) localStorage.setItem('calendar-stickers', JSON.stringify(stickers))
  }, [notes, stickers])

  const days = useMemo(() => {
    const monthStart = startOfMonth(displayDate)
    const monthEnd = endOfMonth(displayDate)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calStart, end: calEnd }).map(date => {
      const dateKey = format(date, 'yyyy-MM-dd')
      const isHoliday = INDIAN_HOLIDAYS.some(h => h.date === dateKey)
      const holiday = isHoliday ? INDIAN_HOLIDAYS.find(h => h.date === dateKey)?.name : undefined
      return {
        date,
        isCurrentMonth: isSameMonth(date, displayDate),
        hasNote: !!notes[`note_${dateKey}_${dateKey}`],
        hasNoteOnRange: Object.keys(notes).some(k => {
          const [s, e] = k.replace('note_', '').split('_')
          return date >= new Date(s + 'T00:00:00') && date <= new Date(e + 'T00:00:00') && isSameDay(date, new Date(s + 'T00:00:00'))
        }),
        sticker: stickers[dateKey],
        holiday,
        isWeekend: getDay(date) === 0 || getDay(date) === 6,
      }
    })
  }, [displayDate, notes, stickers])

  const weeks = useMemo(() => {
    const result: typeof days[] = []
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7))
    }
    return result
  }, [days])

  const getDayState = useCallback((date: Date): 'default' | 'today' | 'start' | 'end' | 'in-range' => {
    if (isToday(date)) return 'today'
    if (!selectedRange.start) return 'default'
    if (!selectedRange.end) return isSameDay(date, selectedRange.start) ? 'start' : 'default'
    if (isSameDay(date, selectedRange.start)) return 'start'
    if (isSameDay(date, selectedRange.end)) return 'end'
    if (isWithinInterval(date, { start: selectedRange.start, end: selectedRange.end })) return 'in-range'
    return 'default'
  }, [selectedRange])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set(e.clientX - centerX)
    y.set(e.clientY - centerY)
  }, [x, y, isMobile])

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) {
      x.set(0)
      y.set(0)
    }
  }, [x, y, isMobile])

  const handleDayClick = useCallback((date: Date) => {
    if (isToday(date)) {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 }, colors: [season.accent, '#ffd700', '#ff6b6b'] })
    }
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      setSelectedRange({ start: date, end: null })
    } else {
      if (date < selectedRange.start) {
        setSelectedRange({ start: date, end: selectedRange.start })
      } else {
        setSelectedRange({ start: selectedRange.start, end: date })
      }
    }
  }, [selectedRange, season.accent])

  const handlePrevMonth = useCallback(() => {
    setDirection(-1)
    setDisplayDate(subMonths(displayDate, 1))
  }, [displayDate])

  const handleNextMonth = useCallback(() => {
    setDirection(1)
    setDisplayDate(addMonths(displayDate, 1))
  }, [displayDate])

  const handleSaveNote = useCallback(() => {
    if (!currentNote.trim() || !selectedRange.start || !selectedRange.end) return
    const key = `note_${format(selectedRange.start, 'yyyy-MM-dd')}_${format(selectedRange.end, 'yyyy-MM-dd')}`
    setNotes(prev => ({ ...prev, [key]: currentNote }))
    setCurrentNote('')
    setShowSavedIndicator(true)
    setTimeout(() => setShowSavedIndicator(false), 2000)
  }, [currentNote, selectedRange])

  const handleStickerSelect = useCallback((sticker: string) => {
    if (!showStickerPicker) return
    const dateKey = format(showStickerPicker, 'yyyy-MM-dd')
    if (stickers[dateKey] === sticker) {
      const newStickers = { ...stickers }
      delete newStickers[dateKey]
      setStickers(newStickers)
    } else {
      setStickers(prev => ({ ...prev, [dateKey]: sticker }))
    }
    setShowStickerPicker(null)
  }, [showStickerPicker, stickers])

  const jumpToToday = useCallback(() => {
    setDisplayDate(startOfMonth(today))
    setDirection(0)
  }, [])

  const rangeKey = selectedRange.start && selectedRange.end
    ? `note_${format(selectedRange.start, 'yyyy-MM-dd')}_${format(selectedRange.end, 'yyyy-MM-dd')}`
    : null
  const savedNote = rangeKey ? notes[rangeKey] : undefined

  const daysLeft = Math.max(0, differenceInDays(endOfMonth(displayDate), today) + 1)

  const pageVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
    }),
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8" style={{ 
      background: isEveningMode 
        ? `repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(255,255,255,0.02) 24px, rgba(255,255,255,0.02) 25px),
                   repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(255,255,255,0.02) 24px, rgba(255,255,255,0.02) 25px),
                   ${darkTheme.bg}` 
        : `repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.02) 24px, rgba(0,0,0,0.02) 25px),
                   repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(0,0,0,0.02) 24px, rgba(0,0,0,0.02) 25px),
                   #f5f0e8`
    }}>
      <motion.div
        ref={cardRef}
        className="relative overflow-hidden w-full max-w-[480px]"
        style={{
          backgroundColor: darkTheme.cardBg,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)',
          borderRadius: 4,
          transformStyle: 'preserve-3d',
          rotateX: isMobile ? 0 : rotateX,
          rotateY: isMobile ? 0 : rotateY,
          perspective: 1200,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <svg width="16" height="24" viewBox="0 0 16 24" fill={darkTheme.accentText}>
            <path d="M8 0a4 4 0 014 4v6a4 4 0 01-8 0V4a4 4 0 014-4zm0 12a2 2 0 012 2v4H6v-4a2 2 0 012-2z"/>
            <rect x="7" y="20" width="2" height="4" fill={darkTheme.accentText}/>
          </svg>
        </div>

        <div className="flex gap-1.5 px-6 py-3 bg-gradient-to-b from-gray-100 to-gray-200 border-b" style={{ borderColor: darkTheme.border }}>
          {[...Array(22)].map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full" style={{
              background: 'linear-gradient(135deg, #d4d4d4 0%, #a0a0a0 50%, #d4d4d4 100%)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.2)'
            }}/>
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={format(displayDate, 'yyyy-MM')}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <div className="relative h-[220px] overflow-hidden">
              <img src={season.image} alt={season.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: season.accent }}>
                {season.nameHindi} · {season.name}
              </div>
              
              <div className="absolute top-4 right-4 cursor-pointer" onClick={() => setIsEveningMode(!isEveningMode)}>
                {isEveningMode ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffd700">
                    <path d="M12 3a9 9 0 109 9 9 9 0 00-9-9zm0 16a7 7 0 110-14 7 7 0 010 14z"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 12h2M4.22 19.78l1.42-1.42M12.64 12.64l1.42-1.42"/>
                  </svg>
                )}
              </div>

              <div className="absolute bottom-0 right-0 w-1/2 h-full" style={{
                backgroundColor: season.accent,
                clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
              }}>
                <span className="absolute bottom-4 right-4 text-white text-3xl font-bold">
                  {format(displayDate, 'yyyy')}
                </span>
              </div>

              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: 'white',
                    top: `${15 + i * 10}%`,
                    left: `${10 + (i * 7) % 70}%`,
                    animation: `float ${2 + i * 0.5}s ease-in-out infinite`,
                    animationDelay: `${i * 0.3}s`,
                    opacity: 0.3 + (i % 3) * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${darkTheme.border}` }}>
          <button onClick={handlePrevMonth} className="p-2 rounded-full hover:scale-110 transition" style={{ backgroundColor: season.accentLight, color: season.accent }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-lg font-semibold" style={{ color: darkTheme.accentText }}>{format(displayDate, 'MMMM yyyy')}</h2>
          <button onClick={handleNextMonth} className="p-2 rounded-full hover:scale-110 transition" style={{ backgroundColor: season.accentLight, color: season.accent }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="flex justify-end px-4 pb-2">
          <button onClick={jumpToToday} className="text-xs px-3 py-1 rounded-full hover:scale-105 transition" style={{ backgroundColor: season.accentLight, color: season.accent }}>
            Today
          </button>
        </div>

        {!isMobile && (
          <div className="grid grid-cols-7 gap-1 px-4 pb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-xs font-medium uppercase" style={{ color: season.accent }}>
                {day}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`grid-${format(displayDate, 'yyyy-MM')}`}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="px-4 pb-2"
          >
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                {!isMobile && (
                  <div className="text-[10px] flex items-center" style={{ color: darkTheme.muted }}>
                    W{Math.ceil(wi + 1)}
                  </div>
                )}
                {week.map(({ date, isCurrentMonth, hasNote, hasNoteOnRange, sticker, holiday, isWeekend }, di) => {
                  const state = getDayState(date)
                  const dateKey = format(date, 'yyyy-MM-dd')
                  const isStart = state === 'start' || (state === 'in-range' && di === 0)
                  const isEnd = state === 'end' || (state === 'in-range' && di === 6)
                  return (
                    <div
                      key={di}
                      className="relative"
                      onClick={() => handleDayClick(date)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setShowStickerPicker(date)
                      }}
                    >
                      <div
                        className="relative min-h-[40px] flex items-center justify-center text-sm rounded-lg transition hover:scale-110 cursor-pointer"
                        style={{
                          backgroundColor: state === 'today' ? season.accent : state === 'in-range' ? `${season.accent}26` : 'transparent',
                          color: state === 'today' || state === 'start' || state === 'end' ? 'white' : isCurrentMonth ? darkTheme.text : darkTheme.muted,
                          opacity: isCurrentMonth ? 1 : 0.3,
                          borderRadius: isStart ? '8px 0 0 8px' : isEnd ? '0 8px 8px 0' : state === 'in-range' ? 0 : 8,
                          border: isWeekend && isCurrentMonth ? `1px solid ${season.accent}40` : undefined,
                        }}
                      >
                        {format(date, 'd')}
                        {(hasNote || hasNoteOnRange) && isCurrentMonth && (
                          <span className="absolute bottom-0.5 w-1 h-1 rounded-full" style={{ backgroundColor: season.accent }} />
                        )}
                        {holiday && isCurrentMonth && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#ff9933' }} title={holiday} />
                        )}
                        {state === 'today' && (
                          <span className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: season.accent, animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                        )}
                      </div>
                      {sticker && (
                        <span className="absolute -top-1 -right-1 text-xs">{sticker}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="px-4 pb-2 text-xs" style={{ color: darkTheme.muted }}>
          {daysLeft} days left in {format(displayDate, 'MMMM')}
        </div>

        <div className="px-4 py-4" style={{ borderTop: `1px solid ${darkTheme.border}` }}>
          <h3 className="text-lg font-medium mb-3" style={{ fontFamily: 'Caveat, cursive', color: darkTheme.accentText }}>
            Notes
          </h3>
          {selectedRange.start && selectedRange.end ? (
            <>
              <p className="text-xs mb-2" style={{ color: darkTheme.muted }}>
                {format(selectedRange.start, 'MMM d')} – {format(selectedRange.end, 'MMM d, yyyy')}
              </p>
              {savedNote && (
                <div className="p-2 rounded mb-2" style={{ backgroundColor: season.accentLight }}>
                  <p className="text-sm" style={{ color: season.accent }}>{savedNote}</p>
                </div>
              )}
              <textarea
                value={currentNote}
                onChange={e => setCurrentNote(e.target.value.slice(0, 500))}
                placeholder="Add a note..."
                className="w-full h-20 p-2 rounded text-sm resize-none"
                style={{
                  fontFamily: 'Caveat, cursive',
                  backgroundColor: 'transparent',
                  border: `1px solid ${darkTheme.border}`,
                  color: darkTheme.text,
                  backgroundImage: `repeating-linear-gradient(transparent, transparent 24px, ${darkTheme.border} 24px, ${darkTheme.border} 25px)`,
                }}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs" style={{ color: darkTheme.muted }}>{currentNote.length}/500</span>
                <button
                  onClick={handleSaveNote}
                  className="px-4 py-1.5 rounded-full text-sm text-white"
                  style={{ backgroundColor: season.accent }}
                >
                  {showSavedIndicator ? '✓ Saved' : 'Save'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm" style={{ color: darkTheme.muted }}>Select a date range to add notes</p>
          )}
        </div>

        <div className="h-4" style={{
          background: `linear-gradient(135deg, transparent 50%, ${darkTheme.cardBg} 50%),
                      linear-gradient(225deg, transparent 50%, ${darkTheme.cardBg} 50%),
                      repeating-linear-gradient(90deg, ${darkTheme.border}, ${darkTheme.border} 8px, transparent 8px, transparent 16px)`,
          backgroundSize: '16px 16px, 16px 16px, auto',
        }} />
      </motion.div>

      {showStickerPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowStickerPicker(null)}>
          <div className="bg-white p-4 rounded-xl grid grid-cols-4 gap-3 shadow-2xl" onClick={e => e.stopPropagation()}>
            {STICKERS.map(sticker => (
              <button
                key={sticker}
                onClick={() => handleStickerSelect(sticker)}
                className="text-2xl p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {sticker}
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-8px); opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}