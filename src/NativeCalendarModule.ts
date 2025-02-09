import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  requestPermissions(): Promise<string>;
  checkPermissions() : Promise<string>;
  findCalendars(): Promise<Object[]>;
  saveCalendar(calendarOptions: Object): Promise<string> ;
  removeCalendar(id: string): Promise<number>;
  removeCalendarByName(name: string): Promise<number>;

  findEventById(calendarId:string, eventId: string): Promise<Object | null>
  fetchAllEvents(startDate: string, endDate: string, calendarIds?: string[]): Promise<Object>;

  saveEvent(calendarId:string, details: Object, options?: Object): Promise<string>;
  updateEvent(calendarId:string, details: Object, options?: Object): Promise<number>;
  removeEvent(calendarId:string, eventId: string): Promise<number>;
  saveEvents(calendarId:string, detailsList: Object[], options?: Object): Promise<string[]>;
  removeEvents(calendarId: string, ids: string[], options?: Object): Promise<number>;
}

export default TurboModuleRegistry.get<Spec>("RNCalendarEvents") as Spec;

