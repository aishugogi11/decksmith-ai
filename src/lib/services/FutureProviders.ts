/**
 * Future integration stubs — Calendar, Weather, Lists.
 * Interfaces only so providers can be swapped without touching the planner.
 */

export interface CalendarEvent {
  id: string;
  title: string;
  startIso: string;
  endIso: string;
}

export interface CalendarProvider {
  listUpcoming(limit?: number): Promise<CalendarEvent[]>;
}

export class StubCalendarProvider implements CalendarProvider {
  async listUpcoming(): Promise<CalendarEvent[]> {
    return [];
  }
}

export interface WeatherSnapshot {
  summary: string;
  tempF: number;
}

export interface WeatherProvider {
  current(lat: number, lng: number): Promise<WeatherSnapshot>;
}

export class StubWeatherProvider implements WeatherProvider {
  async current(): Promise<WeatherSnapshot> {
    return { summary: "Clear", tempF: 68 };
  }
}

export interface ListItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ListsProvider {
  getShoppingList(): Promise<ListItem[]>;
}

export class StubListsProvider implements ListsProvider {
  async getShoppingList(): Promise<ListItem[]> {
    return [];
  }
}

export const calendarProvider: CalendarProvider = new StubCalendarProvider();
export const weatherProvider: WeatherProvider = new StubWeatherProvider();
export const listsProvider: ListsProvider = new StubListsProvider();
