import React from 'react'
import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'
import './Heatmap.css'

const Heatmap = ({ data }) => {
  const values = Object.keys(data || {}).map(date => ({
    date,
    count: data[date] || 0
  }))

  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 6)

  return (
    <div className="custom-heatmap-card">
      <div className="heatmap-scroll">
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={values}
          showWeekdayLabels={true}
          classForValue={(value) => {
            if (!value || value.count === 0) return 'color-empty';
            return `color-github-${Math.min(value.count, 4)}`;
          }}
        />
      </div>

      <div className="heatmap-footer">
        <span className="footer-text">Medication taken per day</span>
        <div className="legend">
          <span>Less</span>
          <div className="legend-box color-empty"></div>
          <div className="legend-box color-github-1"></div>
          <div className="legend-box color-github-2"></div>
          <div className="legend-box color-github-3"></div>
          <div className="legend-box color-github-4"></div>
          <span>More</span>
        </div>
      </div>
    </div>
  )
}

export default Heatmap