import { useEffect, useState } from 'react'
import { getMe, getContributions } from '../api/github'
import Aquarium from '../components/Aquarium'

export default function AquariumPage() {
  const [user, setUser] = useState(null)
  const [contributions, setContributions] = useState([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    getMe()
      .then(res => setUser(res.data))
      .catch(() => { window.location.href = '/' })

    getContributions()
      .then(res => {
        setContributions(res.data.days)
        setTotal(res.data.total)
      })
  }, [])

  if (!user) return <div className="loading">어항을 채우는 중...</div>

  return (
    <div className="aquarium-page">
      <div className="glass profile-card">
        <div className="avatar-wrapper">
          <img src={user.avatar} alt={user.login} className="avatar" />
          <div className="avatar-ring" />
        </div>
        <div className="profile-info">
          <h2>{user.login}</h2>
          <p className="commit-count">올해 총 커밋: <strong>{total.toLocaleString()}</strong></p>
          <div className="profile-stats">
            <span>레포 {user.publicRepos ?? 0}</span>
            <span>팔로워 {user.followers ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="aquarium-canvas-wrapper">
        <Aquarium totalCommits={total} />
      </div>

      <div className="glass contrib-section">
        <h3>Contribution History</h3>
        <div className="contribution-grid">
          {contributions.map(day => (
            <div
              key={day.date}
              className="contrib-cell"
              title={`${day.date}: ${day.count}커밋`}
              style={{ backgroundColor: getColor(day.count) }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function getColor(count) {
  if (count === 0) return 'rgba(180,210,240,0.45)'
  if (count < 3)  return '#9be9a8'
  if (count < 7)  return '#40c463'
  if (count < 12) return '#30a14e'
  return '#216e39'
}
