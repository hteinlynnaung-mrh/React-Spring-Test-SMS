import type { ActivityItem, SchoolEvent } from "../types";
import { Avatar } from "./Avatar";
import { ActivityIcon, Icon } from "./Icon";

const STATUS_LABEL: Record<ActivityItem["status"], string> = {
  IN_PROGRESS: "In progress",
  DONE: "Done",
  ON_HOLD: "On hold",
};

const STATUS_COLOR: Record<ActivityItem["status"], string> = {
  IN_PROGRESS: "#F08A3C",
  DONE: "#3BB98F",
  ON_HOLD: "#E9848A",
};

export function ActivitySchedule({ activities }: { activities: ActivityItem[] }) {
  return (
    <section className="card panel activities-panel">
      <header className="panel-head">
        <h3>Activities Schedule</h3>
        <button className="ghost-btn">
          <Icon name="calendar" size={14} /> Today
        </button>
      </header>

      <ul className="activity-list">
        {activities.map((a) => (
          <li key={a.id} className="activity-item">
            <ActivityIcon icon={a.icon} />
            <div className="activity-main">
              <p className="activity-title">{a.title}</p>
              <p className="activity-desc">{a.description}</p>
            </div>
            <span className="activity-status" style={{ color: STATUS_COLOR[a.status] }}>
              <span className="status-dot" style={{ background: STATUS_COLOR[a.status] }} />
              {STATUS_LABEL[a.status]}
            </span>
            <span className="activity-time">
              <Icon name="clock" size={14} />
              {a.timeRange}
            </span>
            <button className="icon-btn" aria-label="More">
              <Icon name="kebab" size={16} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function UpcomingEvents({ events }: { events: SchoolEvent[] }) {
  return (
    <section className="events-panel">
      <header className="panel-head">
        <h3>Upcoming Events</h3>
        <button className="ghost-btn">
          <Icon name="calendar" size={14} /> All Event
        </button>
      </header>

      {events.slice(0, 2).map((e, i) => (
        <article
          key={e.id}
          className="event-card"
          style={i === 0 ? {} : { opacity: 0.75 }}
        >
          <div className="event-head">
            <span className="event-badge">
              <Icon name="book" size={16} />
            </span>
            <div>
              <p className="event-title">{e.title}</p>
              <small>{e.dateLabel}</small>
            </div>
            <span className="event-rating">
              <Icon name="star" size={12} /> {e.rating.toFixed(1)}
            </span>
          </div>
          <p className="event-desc">{e.description}</p>
          <div className="event-foot">
            <a href="#" onClick={(ev) => ev.preventDefault()}>
              +{e.attendees.toLocaleString()} Students
            </a>
            <div className="event-avatars">
              <Avatar name={`${e.title} a`} size={26} />
              <Avatar name={`${e.title} b`} size={26} />
              <Avatar name={`${e.title} c`} size={26} />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
