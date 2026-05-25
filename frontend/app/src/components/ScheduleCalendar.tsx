import { Calendar as BigCalendar, momentLocalizer, Views } from "react-big-calendar";
import type { SlotInfo, View } from "react-big-calendar";
import moment from "moment";
import type { CalendarEventModel } from "@gym-platform/ui";
import "react-big-calendar/lib/css/react-big-calendar.css";

export interface ScheduleCalendarProps {
  events: CalendarEventModel[];
  defaultView?: View;
  onSelectSlot?: (slot: { startsAt: string; endsAt: string }) => void;
  onSelectEvent?: (event: CalendarEventModel) => void;
}

interface BigCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  model: CalendarEventModel;
}

const localizer = momentLocalizer(moment);

export function ScheduleCalendar({
  events,
  defaultView = Views.WEEK,
  onSelectSlot,
  onSelectEvent
}: ScheduleCalendarProps) {
  const calendarEvents = events.map(toBigCalendarEvent);

  return (
    <div className="schedule-calendar">
      <BigCalendar<BigCalendarEvent>
        localizer={localizer}
        events={calendarEvents}
        defaultView={defaultView}
        views={[Views.WEEK, Views.DAY, Views.MONTH]}
        startAccessor="start"
        endAccessor="end"
        selectable={Boolean(onSelectSlot)}
        onSelectSlot={(slot) => onSelectSlot?.(toSlotPayload(slot))}
        onSelectEvent={(event) => onSelectEvent?.(event.model)}
        popup
      />
    </div>
  );
}

function toBigCalendarEvent(model: CalendarEventModel): BigCalendarEvent {
  return {
    id: model.id,
    title: model.subtitle ? `${model.title} · ${model.subtitle}` : model.title,
    start: new Date(model.startsAt),
    end: new Date(model.endsAt),
    model
  };
}

function toSlotPayload(slot: SlotInfo) {
  return {
    startsAt: slot.start.toISOString(),
    endsAt: slot.end.toISOString()
  };
}
