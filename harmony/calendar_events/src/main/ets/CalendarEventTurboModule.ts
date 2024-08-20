/**
 * MIT License
 *
 * Copyright (C) 2024 Huawei Device Co., Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import Logger from './Logger';
import {BusinessError} from '@ohos.base';
import calendarManager from '@ohos.calendarManager';
import bundleManager from '@ohos.bundle.bundleManager';
import abilityAccessCtrl, { PermissionRequestResult, Permissions } from '@ohos.abilityAccessCtrl';

import {getCalendarType} from "./CalendarUtil"
import {EventDetails, Options} from './EventType'
import { TurboModule, TurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import {AuthorizationStatus, CalendarOptions } from './CalendarType';

import { TM } from '@rnoh/react-native-openharmony/generated/ts';

export const CALENDAR_EVENTS: string = "CalendarEventsView"
export let calendarMgr: calendarManager.CalendarManager | null = null;
let authorized: string = "authorized";
export class CalendarEventTurboModule extends TurboModule implements TM.RNCalendarEvents.Spec{
  constructor(ctx: TurboModuleContext) {
    super(ctx);
  }

  async checkAccessToken(permission: Permissions): Promise<abilityAccessCtrl.GrantStatus> {
    let grantStatus: abilityAccessCtrl.GrantStatus;
    let atManager = abilityAccessCtrl.createAtManager();
    // 获取应用程序的accessTokenID
    let tokenId: number;
    try {
      let bundleInfo: bundleManager.BundleInfo =
        await bundleManager.getBundleInfoForSelf(bundleManager.BundleFlag.GET_BUNDLE_INFO_WITH_APPLICATION);
      let appInfo: bundleManager.ApplicationInfo = bundleInfo.appInfo;
      tokenId = appInfo.accessTokenId;
    } catch (err) {
      Logger.error(`getBundleInfoForSelf failed, code is ${err.code}, message is ${err.message}`);
    }
    try {
      grantStatus = await atManager.checkAccessToken(tokenId, permission);
    } catch (err) {
      Logger.error(`checkAccessToken failed, code is ${err.code}, message is ${err.message}`);
    }
    return grantStatus;
  }

  async checkPermissions(): Promise<AuthorizationStatus> {
    const permissions: Array<Permissions> = ['ohos.permission.READ_CALENDAR'];
    let grantStatus: abilityAccessCtrl.GrantStatus = await this.checkAccessToken(permissions[0]);
    if (grantStatus === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED) {
      Logger.info(`checkPermissions authorized`);
      return new Promise((resolve, reject) => {
        resolve("authorized");
      });
    }
    if (grantStatus === abilityAccessCtrl.GrantStatus.PERMISSION_DENIED) {
      Logger.info(`checkPermissions denied`);
      return new Promise((resolve, reject) => {
        resolve("denied");
      });
    }
  }

  //requestPermiss
  async requestPermissions(): Promise<AuthorizationStatus> {
    let atManager = abilityAccessCtrl.createAtManager();
    let permissionRequestResult : PermissionRequestResult = null;
    const permissions: Permissions[] = ['ohos.permission.READ_CALENDAR', 'ohos.permission.WRITE_CALENDAR'];
    await atManager.requestPermissionsFromUser(this.ctx.uiAbilityContext, permissions).then(
      (result: PermissionRequestResult) => {
        permissionRequestResult = result;
      }).catch((error: BusinessError) => {
      Logger.error(`requestPermissionsAsync failed, code is ${error.code}, message is ${error.message}`);
    })
    Logger.info(`requestPermissions result =` + permissionRequestResult.permissions);
    return await this.checkPermissions()
  }

  //findCalendars
  async findCalendars(): Promise<CalendarOptions[]> {
    let checkPermission: string = await this.checkPermissions();
    if (checkPermission == authorized) {
      let calendar : calendarManager.Calendar[] | undefined = undefined;
      let calendarResult : CalendarOptions[] = []
      calendarMgr = calendarManager.getCalendarManager(this.ctx.uiAbilityContext);
      await calendarMgr.getAllCalendars().then(
        async (calendarData:calendarManager.Calendar[]) => {calendar = calendarData}
      );
      if (calendar && calendar.length > 0) {
        calendar.forEach(item => {
          calendarResult.push(new CalendarOptions(item.id.toString(), item.getAccount().name, item.getAccount().type))
        })
      }
      return new Promise((resolve, reject) => {
        resolve(calendarResult);
      });
    } else {
      return new Promise((resolve, reject) => {
        resolve([]);
      });
    }
  }

  //saveCalendar
  async saveCalendar(calendarOptions: CalendarOptions): Promise<string> {
    await this.checkHasPermissions();
   
      const calendarAccount: calendarManager.CalendarAccount = {
        name: calendarOptions.title,
        type: getCalendarType(calendarOptions.type),
        displayName: calendarOptions.displayName != undefined ? calendarOptions.displayName : ""
      };
      const calendarMgr = this.getCalendarManager();
      if(!calendarManager) throw 'calendarMgr is null';
      const calendar = await calendarMgr.createCalendar(calendarAccount);
      if(!calendar) return '';
      return calendar.id + '';
  }

  getCalendarManager(): calendarManager.CalendarManager | null {
    return calendarManager.getCalendarManager(this.ctx.uiAbilityContext);
  }

  async checkHasPermissions(): Promise<string> {
    let checkPermission: string = await this.checkPermissions();
    if (checkPermission !== authorized) throw 'Permission denied';
    return checkPermission;
  }

  async getDefaultCalendar(): Promise<calendarManager.Calendar | null> {
    const calendarMgr = this.getCalendarManager();
    if(!calendarMgr) throw 'calendarMgr is null';
    return await calendarMgr.getCalendar();
  }

  async getCalendarById(id: string): Promise<calendarManager.Calendar | null> {
    if(!id) return null;
    const calendarMgr = this.getCalendarManager();
    if(!calendarMgr) throw 'calendarMgr is null';
    const calendars = await calendarMgr.getAllCalendars();
    return calendars.find(cal => `${cal.id}}` === id) || null;
  }

  //removeCalendar
  async removeCalendarById(id: string): Promise<number> {
    await this.checkHasPermissions();

    const calendars = await this.findCalendars();
    const calendar = calendars.find(cal => cal.id === id && cal.title !== 'phone');
    if(!calendar) return 0;
    const calendarAccount: calendarManager.CalendarAccount = {
      name: calendar.title,
      type: getCalendarType(calendar.type)
    };
    const calendarMgr = this.getCalendarManager();
    if(!calendarMgr) throw 'calendarMgr is null';
    await calendarMgr.getCalendar(calendarAccount).then(async (calendarData:calendarManager.Calendar) => {
      await calendarMgr.deleteCalendar(calendarData);
    });
    return 1;
  }

  async removeCalendar(id: string): Promise<number> {
    let checkPermission: string = await this.checkPermissions();
    if (checkPermission !== authorized) throw 'Permission denied';
    return await this.removeCalendarById(id);
  }

  async removeCalendarByName(name: string): Promise<number> {
    let checkPermission: string = await this.checkPermissions();
    if (checkPermission !== authorized) throw 'Permission denied';
    const calendars = await this.findCalendars();
    const calendar = calendars.find(cal => cal.title === name && cal.title !== 'phone');
    if(!calendar) return 0;
    const calendarMgr = this.getCalendarManager();
    if(!calendarMgr) throw 'calendarMgr is null';
    await calendarMgr.getCalendar({name: calendar.title, type: getCalendarType(calendar.type)}).then(async (calendarData:calendarManager.Calendar) => {
      await calendarMgr.deleteCalendar(calendarData);
    });
    return 1; // Ninjar
  }

  //findEventById
  async findEventById(calendarId: string, eventId: string): Promise<calendarManager.Event | null> {
    await this.checkHasPermissions();
    const calendar : calendarManager.Calendar = await this.getCalendarById(calendarId);
    if(!calendar) return null;
    const filter = calendarManager.EventFilter.filterById([Number.parseFloat(eventId)]);
    const events = await calendar.getEvents(filter);
    return events?.[0] || null;
  }

  //fetchAllEvents
  async fetchAllEvents(startDate: string, endDate: string, calendarIds?: string[]): Promise<calendarManager.Event[]> {
    await this.checkHasPermissions();
    let calendars : calendarManager.Calendar[] = [];
    if(calendarIds?.length) {
      calendars = await Promise.all(calendarIds.map(id => this.getCalendarById(id)));
    } else {
      const calendar = await this.getDefaultCalendar();
      if(calendar) calendars.push(calendar);
    }
    const events: calendarManager.Event[] = [];
    for(const calendar of calendars) {
      if(!calendar) continue;
      let filter = undefined;
      if(startDate && endDate) {
        filter = calendarManager.EventFilter.filterByTime(Number.parseInt(startDate), Number.parseInt(endDate));
      }
      const events = await calendar.getEvents(filter);
      events.push(...events);
    }
    return events;
  }

  //saveEvent
  async saveEvent(calendarId: string, details: EventDetails, options?: Options): Promise<string> {
    await this.checkHasPermissions();
    const calendar = calendarId ? await this.getCalendarById(calendarId) : await this.getDefaultCalendar();
    if(!calendar) throw 'Calendar not found';
    const event = details; // calendarManager.Event.createEvent(details);
    const eventId = await calendar.addEvent(event);
    return eventId + '';
  }

  //saveEvents
  async saveEvents(calendarId: string, detailsList: EventDetails[], options?: Options): Promise<string[]> {
    await this.checkHasPermissions();
    const calendar = calendarId ? await this.getCalendarById(calendarId) : await this.getDefaultCalendar();
    if(!calendar) throw 'Calendar not found';
    const eventIds: string[] = [];
    for(const details of detailsList) {
      const event = details; // calendarManager.Event.createEvent(details);
      const eventId = await calendar.addEvent(event);
      eventIds.push(eventId + '');
    }
    return eventIds;
  }

  //updateEvent
  async updateEvent(calendarId: string, details: EventDetails, options?: Options): Promise<number> {
    await this.checkHasPermissions();
    const calendar = calendarId ? await this.getCalendarById(calendarId) : await this.getDefaultCalendar();
    if(!calendar) return 0;
    const event = details; // calendarManager.Event.createEvent(details);
    await calendar.updateEvent(event);
    return 1;
  }

  //removeEvent
  async removeEvent(calendarId: string, eventId: string): Promise<number> {
    await this.checkHasPermissions();
    const calendar = calendarId ? await this.getCalendarById(calendarId) : await this.getDefaultCalendar();
    if(!calendar) return 0;
    await calendar.deleteEvent(Number.parseInt(eventId));
    return 1;
  }

  async removeEvents(calendarId: string, eventIds: string[]): Promise<number> {
    await this.checkHasPermissions();
    const calendar = calendarId ? await this.getCalendarById(calendarId) : await this.getDefaultCalendar();
    if(!calendar) return 0;
    const ids = eventIds.map(id => Number.parseInt(id));
    await calendar.deleteEvents(ids);
    return ids.length;
  }
}