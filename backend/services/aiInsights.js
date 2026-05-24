export const generateInsights = (medications = []) => {
  const insights = []

  const total = medications.length
  const missed = medications.filter(m => m.status === 'Missed').length
  const taken = medications.filter(m => m.status === 'Taken').length
  const eveningMeds = medications.filter(m => m.reminderTime?.includes('PM'))
  const missedEvening = eveningMeds.filter(m => m.status === 'Missed').length

  if (total === 0) {
    return ['Start adding medications to get insights']
  }

  if (missed > taken) {
    insights.push('You are missing more doses than you take. Try setting reminders.')
  }

  if (missedEvening > 0) {
    insights.push('You often miss evening doses. Try setting earlier reminders.')
  }

  if (total > 0 && taken / total > 0.8) {
    insights.push('Excellent adherence! Keep it up.')
  }

  if (eveningMeds.length > 0 && missedEvening === 0) {
    insights.push('Great job keeping up with your evening medications.')
  }

  if (medications.some(m => m.inventory <= 5 && m.inventory > 0)) {
    insights.push('Some medications are running low. Consider restocking soon.')
  }

  if (medications.some(m => m.inventory === 0)) {
    insights.push('Some medications are out of stock. Please refill immediately.')
  }

  return insights
}