import RNCalendarEvents , {Spec} from "./NativeCalendarModule"
import {AuthorizationStatus, CalendarOptions, EventDetails, Options} from "./calendarType"

  
export default class ReactNativeCalendarEvents{
    static requestPermissions(): Promise<string> {
        return RNCalendarEvents.requestPermissions()
    }
    static checkPermissions(): Promise<string> {
        return RNCalendarEvents.checkPermissions()
    }
    static findCalendars(): Promise<Object[]> {
        return RNCalendarEvents.findCalendars()
    }

    static saveCalendar(calendarOptions: Object): Promise<string> {
        return RNCalendarEvents.saveCalendar(calendarOptions)
    }

    static removeCalendar(id: string): Promise<number> {
        return RNCalendarEvents.removeCalendar(id)
    }

    static removeCalendarByName(name: string): Promise<number> {
        return RNCalendarEvents.removeCalendarByName(name);
    }

    static findEventById(calendarId: string, eventId: string): Promise<Object | null> {
        return RNCalendarEvents.findEventById(calendarId, eventId)
    }
 
    static fetchAllEvents(startDate: string, endDate: string, calendarIds?: string[]): Promise<Object> {
        return RNCalendarEvents.fetchAllEvents(startDate, endDate, calendarIds)
    }
    
    static saveEvent(calendarId:string,  details: Object, options?: Object): Promise<String> {
        return RNCalendarEvents.saveEvent(calendarId, details, options)
    }

    static removeEvent(calendarId:string, eventId: string): Promise<number> {
        return RNCalendarEvents.removeEvent(calendarId, eventId)
    }

    static saveEvents(calendarId: string, detailsList: EventDetails[], options?:Options): Promise<string[]> {
        return RNCalendarEvents.saveEvents(calendarId, detailsList, options);
    }

    static removeEvents(calendarId: string, eventIds: string[], options?: Options): Promise<number> {
        return RNCalendarEvents.removeEvents(calendarId, eventIds, options);
    }

    static updateEvent(calendarId: string, details: Object, options?: Object): Promise<number> {
        return RNCalendarEvents.updateEvent(calendarId,details, options);
    }
};