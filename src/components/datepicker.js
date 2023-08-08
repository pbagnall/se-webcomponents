import './popup.js';
import './selection.js';
import { getShortcut } from '../lib/keyboard.js';
import { extractDate } from "../lib/dateRecogniser.js";
import { setupInput as si, updateValue as uv } from '../lib/inputElement.js';
import { makeSvgIcons } from "../lib/svg.js";
import dayjs from "dayjs/esm/index";

const icons = makeSvgIcons({
   calendar: { width: 32, height: 32, svg:`
      <rect x="5" y="0" width="8" height="7" rx="2"/>
      <rect x="19" y="0" width="8" height="7" rx="2"/>
      <rect x="0" y="5" width="32" height="27" rx="4"/>
      <rect x="3" y="8" width="26" height="21" rx="1" fill='white'/>
      <path d="M13.073,24.949L10.604,24.949L10.604,15.641C9.701,16.485 8.638,17.109 7.413,17.513L7.413,15.272C8.058,15.061 8.758,14.661 9.514,14.072C10.27,13.484 10.788,12.797 11.069,12.011L13.073,12.011L13.073,24.949Z"/>
      <path d="M25.105,22.655L25.105,24.949L16.448,24.949C16.542,24.082 16.823,23.26 17.292,22.484C17.761,21.707 18.687,20.677 20.069,19.394C21.183,18.357 21.865,17.654 22.117,17.285C22.457,16.775 22.627,16.271 22.627,15.773C22.627,15.222 22.479,14.799 22.183,14.503C21.887,14.207 21.479,14.059 20.957,14.059C20.441,14.059 20.031,14.214 19.727,14.525C19.422,14.836 19.246,15.351 19.199,16.072L16.738,15.826C16.885,14.466 17.345,13.491 18.118,12.899C18.892,12.307 19.858,12.011 21.019,12.011C22.29,12.011 23.289,12.354 24.016,13.04C24.742,13.725 25.105,14.578 25.105,15.597C25.105,16.177 25.001,16.73 24.793,17.254C24.585,17.778 24.256,18.328 23.805,18.902C23.506,19.283 22.967,19.831 22.187,20.546C21.408,21.26 20.915,21.735 20.707,21.969C20.499,22.204 20.33,22.432 20.201,22.655L25.105,22.655Z"/>
   `},
   up: { width: 16, height: 16, svg: '<path d="M8,3.2L14,12.8L2,12.8L8,3.2Z"/>'},
   down: { width: 16, height: 16, svg: '<path d="M8,12.8 L14,3.2 L2,3.2 L8,12.8Z"/>'},
   upFast: { width: 16, height: 16, svg: '<path d="M8,-0L14,9.6L2,9.6L8,-0Z"/><path d="M8,6.4L14,16L2,16L8,6.4Z"/>'},
   downFast: { width: 16, height: 16, svg: '<path d="M8,16L2,6.4L14,6.4L8,16Z"/><path d="M8,9.6L2,0L14,0L8,9.6Z"/>'}
});

const datePickerTemplate = document.createElement('template');
datePickerTemplate.innerHTML = `
    <style>
        div.datepicker {
            display: inline-flex;
            box-sizing: border-box;
            border: 1px solid #888888;
            border-radius: 0.1875rem;
            height: 1.5rem;
            font-family: Avenir, sans-serif;
        }

        input.field {
            border: none;
            border-radius: 0.125rem 0 0 0.125rem;
            background-color: lightyellow;
            height: 1.25rem;
            vertical-align: bottom;
            margin: 0;
            width: 4.5rem;
        }
        
        input.field:focus,
        button.trigger:focus {
            outline: none;
        }

        div.datepicker:has(input.field:focus),
        div.datepicker:has(button.trigger:focus) {
            outline: Highlight auto 2px;
            /*noinspection CssOverwrittenProperties*/
            outline: -webkit-focus-ring-color auto 2px;
        }

        button.trigger {
            font-family: Avenir, sans-serif;
            background-color: #eeeeee;
            border: none;
            border-radius: 0 0.125rem 0.125rem 0;
            margin: 0;
            height: 1.375rem;
            vertical-align: bottom;
            background-image: url(${icons.calendar});
            background-repeat: no-repeat;
            background-size: 16px;
            background-position: center center;
            width: 24px;
        }
        
        div.datepicker:hover button.trigger        { background-color: #cccccc; }
        div.datepicker       button.trigger:active { background-color: #aaaaaa; }
    </style>
    <div class='datepicker' id='date-picker'>
    <input class='field' type='text' value='no selection' /><button tabindex=0 class='trigger'></button>
    </div>
`;

const dialogTemplate = document.createElement('template');
// language = HTML
dialogTemplate.innerHTML = `
   <style id='popup'>
      se-popup#calendar {
         --padding: 0;
      }
      
      se-popup#calendar::-webkit-scrollbar {
         background: transparent;
         width: 0;
      }
      
      #cal {
          --datepicker-oddPeriodBackground: var(--oddPeriodBackground, #eaeaea);
          --datepicker-evenPeriodBackground: var(--evenPeriodBackground, #ffffff);
          --datepicker-toolbarBackground: var(--toolbarBackground, #d0d0d0);
          --datepicker-foreground: var(--foreground, #000000);
          --datepicker-hoverColor: var(--hoverColor, #ffffff);
          --datepicker-hoverBackgroundColor: var(--hoverBackgroundColor, #ff000080);
          --datepicker-selectedColor: var(--selectedColor, #ffffff);
          --datepicker-selectedBackgroundColor: var(--selectedBackgroundColor, #ff0000);
          --datepicker-todayBorderColor: var(--todayBorderColor, orange);

          height: 16rem;
          color: var(--datepicker-foreground);
          overflow: auto;
          scrollbar-width: none;
          font-size: 0.8em;
          font-family: Avenir, sans-serif;
      }

      #cal::-webkit-scrollbar {
         width: 0;
         background: transparent;
      }
      
      #cal table {
         position: relative;
         border-spacing: 0;
         border-collapse: collapse;
         margin: 0;
      }
      
      #cal thead,
      #cal tfoot {
         position: sticky;
         background-color: var(--datepicker-toolbarBackground);
         padding: 0;
         margin: 0;
         z-index: 1;
      }
      
      #cal thead { top: 0; }
      #cal tfoot { bottom: 0; }

      #cal thead button,
      #cal tfoot button {
        height: 1.5rem;
        width: 1.5rem;
        border: none;
        border-radius: 20%;
        background-color: #eeeeee;
        background-repeat: no-repeat;
        background-size: 1.1rem;
        background-position: center center;
      }
      
      #cal thead button#backmonth    { background-image: url(${icons.up }); }
      #cal thead button#backyear     { background-image: url(${icons.upFast }); }
      #cal tfoot button#forwardmonth { background-image: url(${icons.down }); }
      #cal tfoot button#forwardyear  { background-image: url(${icons.downFast }); }
      
      #cal th.month, 
      #cal th.year {
         vertical-align: top;
         position: relative;
      }
      
      #cal th.month span,
      #cal th.year span {
         position: sticky;
         top: 2rem;
         writing-mode: vertical-lr;
         text-orientation: sideways;
         padding: 3px;
      } 
      
      #cal tr.oddPeriod,
      #cal td.oddPeriod, 
      #cal th.oddPeriod {
          background-color: var(--datepicker-oddPeriodBackground);      
      }

      #cal tr.evenPeriod,
      #cal td.evenPeriod,
      #cal th.evenPeriod {
          background-color: var(--datepicker-evenPeriodBackground);      
      }
      
      #cal td {
          padding: 2px;
          margin-left: 2px;
          text-align: center;
          min-width: 2.2em;
      }
      
      #cal td span {
          display: inline-block;
          width: calc(100% - 4px);
          border-radius: 40px;
          border-color: transparent;
      }

      #cal td:hover span {
          color: var(--datepicker-hoverColor);
          background-color: var(--datepicker-hoverBackgroundColor);
      }
      
      #cal td.selected span {
          color: var(--datepicker-selectedColor);
          background-color: var(--datepicker-selectedBackgroundColor);
      }
      
      #cal td.today span {
          border: 2px solid var(--datepicker-todayBorderColor);
          padding: 0;
          margin: 0;
      }
   </style>
   <se-popup id='calendar' anchor='date-picker' anchor-direction='se,sm,sw,ne,nm,nw,em,wm'>
      <div id='cal'>
         <table>
            <thead>
               <tr>
                  <th scope='col'>Mon</th>
                  <th scope='col'>Tue</th>
                  <th scope='col'>Wed</th>
                  <th scope='col'>Thu</th>
                  <th scope='col'>Fri</th>
                  <th scope='col'>Sat</th>
                  <th scope='col'>Sun</th>
                  <td><button id='backmonth' data-direction="back" data-unit="month" title='Back a month (Ctrl-Up)'></button></td>
                  <td><button id='backyear' data-direction="back" data-unit="year" title='Back a year (PageUp)'></button></td>
               </tr>
            </thead>
            <tfoot>
               <tr>
                  <td></td>
                  <td></td>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <td><button id='forwardmonth' data-direction="forward"
                              data-unit="month" title='Forwards a month (Ctrl-Down)'></button></td>
                  <td><button id='forwardyear' data-direction="forward"
                              data-unit="year" title='Forwards a year (PageDown)'></button></td>
               </tr>
            </tfoot>
            <tbody>
            </tbody>
         </table>
      </div>
   </se-popup>
`;

const interpretationTemplate = document.createElement('template');
interpretationTemplate.innerHTML = `
   <style id='interpretStyle'>
      se-popup#interpret {
         font-size: 0.8em;
         font-family: Avenir, sans-serif;
         width: max-content;
         height: max-content;
         --padding: 0;
         --borderWidth: 1px;
      }
      
      se-popup#interpret se-selection {
         --border-style: none;
      }
   </style>
   <se-popup id='interpret' anchor='date-picker' anchor-direction='se,sw,ne,nw,wm,em' >
      <se-selection>
      </se-selection>
   </se-popup>
`;

class DatePicker extends HTMLElement {
   setupInput = si;
   updateValue = uv;

   constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.shadowRoot.append(datePickerTemplate.content.cloneNode(true));

      this.input = this.shadowRoot.querySelector("input.field");
      this.trigger = this.shadowRoot.querySelector("button.trigger");
      this.scrolled = () => this.scrolledDialog();
      this.popupOpened = () => this.popupOpenedHandler();
      this.popupClosed = () => this.popupClosedHandler();
      this.keyboardHandler = (e) => this.keyboard(e);

      this.trigger.addEventListener('click', () => this.triggerClicked());
      const focus = (event) => this.inputFocussed(event);
      this.input.addEventListener('focus', focus);
      this.input.addEventListener('input', () => this.typing());
      this.input.addEventListener('change', () => this.commitTyping());
      this.popupIsOpen = false;

      this.shadowRoot.appendChild(interpretationTemplate.content.cloneNode(true));
      this.interpretationIsOpen = false;
      this.interpretation = this.shadowRoot.querySelector("se-popup#interpret");
      this.interpretationList = this.shadowRoot.querySelector('se-selection');
      this.interpretationList.addEventListener("selected", (event) => this.selectInterpretation(event));
   }

   // noinspection JSUnusedGlobalSymbols
   connectedCallback() {
      this.dateValue = this.getDateAttribute();
      this.input.value = this.dateValue.format("DD MMM YYYY");

      if (this.hasAttribute('open')) this.openDatePicker();
      this.setupInput();
      this.updateValue(this.dateValue.format("YYYY-MM-DD"));
   }

   inputFocussed(event) {
      if (event.type === 'click') {
         event.preventDefault();
         event.stopPropagation();
      }
      this.input.focus();
      this.input.setSelectionRange(0, this.input.value.length);
   }

   typing() {
      const dates = extractDate(this.input.value);
      if (dates.length>0) {
         this.openInterpretation(dates);
      }

      this.addDateToInterpretation(dates);
   }

   openInterpretation() {
      if (!this.interpretationIsOpen) {
         this.interpretation.open();
         this.interpretationIsOpen = true;
      }
   }

   selectInterpretation(event) {
      this.dateValue = dayjs(event.value);
      this.input.value = this.dateValue.format("DD MMM YYYY");
      this.closeInterpretation(true);
   }

   closeInterpretation(fireEvent) {
      this.interpretation.close();
      this.interpretationIsOpen = false;
      if (fireEvent) this.fireDateChangeEvent(this.dateValue, true);
   }

   addDateToInterpretation(dates) {
      if (dates.length === 0) {
         this.closeInterpretation(false);
         return;
      }

      let html = '';
      for (const date of dates) {
         const humanDate = dayjs(date).format("DD MMMM YYYY");
         const isoDate = dayjs(date).format("YYYY-MM-DD");
         html+=`<option value='${isoDate}'>${humanDate}</option>`;
      }

      this.interpretationList.innerHTML = html;
   }

   commitTyping(event) {
      const dates = extractDate(this.input.value);
      if (dates.length>0) {
         this.dateValue = dayjs(dates[0]);
         this.input.value = this.dateValue.format("DD MMM YYYY");
         this.closeInterpretation(true);
      }
   }

   getDateAttribute() {
      if (this.getAttribute('date') !== '') return dayjs();
      if (this.getAttribute('date') === 'today') return dayjs();

      const dateValue = dayjs(this.attributes['date'].value);
      // noinspection JSCheckFunctionSignatures
      if (isNaN(dateValue.valueOf())) {
         return dayjs();
      }

      return dateValue;
   }

   triggerClicked() {
      if (this.popupIsOpen) {
         this.closeDatePicker();
      } else {
         this.openDatePicker();
      }
   }

   openDatePicker() {
      const quickButtons = (e) => this.quickButtons(e);

      this.shadowRoot.appendChild(dialogTemplate.content.cloneNode(true));
      this.popupIsOpen = true;
      this.popup = this.shadowRoot.querySelector("se-popup#calendar");
      this.dialog = this.shadowRoot.querySelector("#cal");
      this.dialog.addEventListener('scroll', this.scrolled);
      this.input = this.shadowRoot.querySelector("input.field");

      this.trigger.addEventListener("keydown", this.keyboardHandler);
      this.trigger.focus();

      const upMonth = this.shadowRoot.getElementById('backmonth');
      const upYear = this.shadowRoot.getElementById('backyear');
      const downMonth = this.shadowRoot.getElementById('forwardmonth');
      const downYear = this.shadowRoot.getElementById('forwardyear');
      upMonth.addEventListener("click", quickButtons);
      upYear.addEventListener("click", quickButtons);
      downMonth.addEventListener("click", quickButtons);
      downYear.addEventListener("click", quickButtons);

      this.populateCalendar();
      this.popup.addEventListener("open", this.popupOpened);
      this.popup.addEventListener("close", this.popupClosed);
      this.popup.open();
   }

   keyboardCommands = {
      // move by 1 day or 1 week
      "ArrowDown":    { type: 'delta', delta: 7 },
      "ArrowUp":      { type: 'delta', delta: -7 },
      "ArrowLeft":    { type: 'delta', delta: -1 },
      "ArrowRight":   { type: 'delta', delta: 1 },

      // this should jump by ~one month, preserving day of week, 4 or 5 weeks
      "C-ArrowDown":  { type: "month", direction: 1 },
      "C-ArrowUp":    { type: "month", direction: -1 },
      "M-ArrowDown":  { type: "month", direction: 1 },
      "M-ArrowUp":    { type: "month", direction: -1 },

      // this jumps by ~1 year, preserving day of the week. 52 weeks
      "PageUp":       { type: 'delta', delta: -364 },
      "PageDown":     { type: 'delta', delta: 364 },

      // move to start or end of week
      "C-ArrowLeft":  { type: "day", day: 1 },
      "C-ArrowRight": { type: "day", day: 7 },
      "Home":         { type: "day", day: 1 },
      "End":          { type: "day", day: 7 },

      // commit the date and close the popup
      "Enter":        { type: "commit" },

      // cancel the change and close the popup
      "Escape":       { type: "cancel" }
   };

   keyboard(event) {
      event.preventDefault();
      const command = this.keyboardCommands[getShortcut(event)];
      if (typeof command === 'undefined') return;

      this.action(command);
   }
   
   action(command) {
      const tbody = this.dialog.querySelector("tbody");
      this.highlightDate(tbody, this.dateValue, false);

      switch (command.type) {
         case "delta":
            this.dateValue = this.dateValue.add(command.delta, 'day');
            break;
         case "day":
            if (this.dateValue.day()===0) this.dateValue = this.dateValue.subtract(1, 'day');
            this.dateValue =  this.dateValue.day(command.day);
            break;
         case "month":
            const fourWeeks = this.dateValue.add(4 * command.direction, "week");
            const fiveWeeks = this.dateValue.add(5 * command.direction, "week");
            const fourDiff = Math.abs(this.dateValue.date() - fourWeeks.date());
            const fiveDiff = Math.abs(this.dateValue.date() - fiveWeeks.date());
            this.dateValue = fourDiff < fiveDiff ? fourWeeks : fiveWeeks;
            break;
         case "commit":
            this.closeDatePicker();
            this.fireDateChangeEvent(this.dateValue, true);
            return;
         case "cancel":
            // TODO: not actually cancelling. Need to record initial value.
            this.closeDatePicker();
            this.fireDateChangeEvent(this.dateValue, true);
            return;
      }

      const earliestDate = dayjs(tbody.firstElementChild.dataset['beginning']);
      const weeksIn = this.dateValue.diff(earliestDate, 'week');
      const weeksToAddAtEnd = weeksIn - (tbody.children.length/2);

      if (weeksToAddAtEnd < 0) {
         this.addWeeksAtStart(-weeksToAddAtEnd);
         this.removeLastNWeeks(-weeksToAddAtEnd);
      } else if (weeksToAddAtEnd > 0) {
         this.addWeeksAtEnd(weeksToAddAtEnd);
         this.removeFirstNWeeks(weeksToAddAtEnd);
      }

      // TODO: make this preserve the position of the selection in the dialog
      this.scrollToDate(this.dateValue);

      this.highlightDate(tbody, this.dateValue, true);
      this.fireDateChangeEvent(this.dateValue, false);
   }

   getSelectionWeek(tbody, date) {
      const week = date.day() === 0 ? date.subtract(6, 'day') : date.day(1);
      const selector = `tr[data-beginning=\"${week.format('YYYY-MM-DD')}\"]`;
      return tbody.querySelector(selector);
   }

   highlightDate(tbody, date, show) {
      const weekElem = this.getSelectionWeek(tbody, date);

      // for dateValue monday = 1, sunday = 0
      // item is zero based, so monday needs to be 0, sunday = 6
      const dayElem = weekElem.children.item((date.day()+6) % 7);
      if (show) {
         dayElem.classList.add("selected");
      } else {
         dayElem.classList.remove("selected");
      }
   }

   buttonCommands = {
      // this should jump by ~one month, preserving day of week, 4 or 5 weeks
      "forwardmonth": { type: "month", direction: 1 },
      "backmonth":    { type: "month", direction: -1 },

      // this jumps by ~1 year, preserving day of the week. 52 weeks
      "backyear":     { type: 'delta', delta: -364 },
      "forwardyear":  { type: 'delta', delta: 364 },
   }

   quickButtons(event) {
      let command = this.buttonCommands[event.target.id];
      if (!command) return;
      this.action(command);
   }

   addPeriodMarker(period, parent, row, startDate) {
      const params = {
         month: ["M", "YYYYMM", "MMM", "month"],
         year: ["Y", "YYYY", "YYYY", "year"]
      }
      const [ idprefix, idformat, format, klass ] = params[period];
      const periodMarker = parent.querySelector("#"+idprefix+startDate.format(idformat));

      // Does the period marker already exist?
      // If so
      if (periodMarker) {
         if (periodMarker.parentElement.dataset['beginning'] > row.dataset['beginning']) {
            row.appendChild(periodMarker);
         }
         periodMarker.rowSpan++;
      } else {
         const periodMarkerCell = document.createElement("th");
         periodMarkerCell.id = idprefix+startDate.format(idformat);
         periodMarkerCell.classList.add(klass);
         if (period === "month") {
            periodMarkerCell.classList.add(startDate.month() % 2 === 0 ? "oddPeriod" : "evenPeriod");
         } else { // period == year
            periodMarkerCell.classList.add(startDate.year() % 2 === 0 ? "evenPeriod" : "oddPeriod");
         }
         const span = document.createElement('span');
         span.appendChild(document.createTextNode(startDate.format(format)));
         periodMarkerCell.appendChild(span);
         row.appendChild(periodMarkerCell);
      }
   }

   buildWeek(tbody, startDate) {
      const row = document.createElement("tr");
      const today = dayjs();
      const startMonth = startDate.month();
      row.classList.add(startMonth % 2 === 0 ? "oddPeriod" : "evenPeriod");
      row.dataset['beginning'] = startDate.format('YYYY-MM-DD');

      let weekday = startDate;
      for (let day=0; day<7; day++) {
         const cell = document.createElement("td");
         if (weekday.isSame(today, 'day')) cell.classList.add("today");
         if (weekday.isSame(this.dateValue, 'day')) cell.classList.add("selected");
         if (weekday.month() !== startDate.month()) {
            cell.classList.add(weekday.month() % 2 === 0 ? "oddPeriod" : "evenPeriod");
         }

         const span = document.createElement("span");
         span.appendChild(document.createTextNode(weekday.format('D')));
         cell.appendChild(span);
         row.appendChild(cell);
         weekday = weekday.add(1, 'day');
      }

      const endOfWeek = startDate.add(6, 'day');
      this.addPeriodMarker('month', tbody, row, endOfWeek);
      this.addPeriodMarker('year', tbody, row, endOfWeek);
      return row;
   }

   addWeeksAtStart(weeks) {
      const tbody = this.dialog.querySelector("tbody");
      let first = tbody.firstElementChild;
      let startDate = dayjs(first.dataset['beginning']).subtract(7, 'day');
      let scrollBy = 0;

      for (let i=0; i<weeks; i++) {
         const row = this.buildWeek(tbody, startDate);
         tbody.insertBefore(row, first);
         first = row;
         startDate = startDate.subtract(7, 'day');
         scrollBy += first.getBoundingClientRect().height;
      }

      this.dialog.scrollBy(0, scrollBy);
   }

   addWeeksAtEnd(weeks, startDate) {
      const tbody = this.dialog.querySelector("tbody");
      if (typeof startDate === 'undefined') {
         startDate = dayjs(tbody.lastElementChild.dataset['beginning']).add(7, 'day');
      }
      startDate = startDate.day(1);

      for (let i=0; i<weeks; i++) {
         const row = this.buildWeek(tbody, startDate);
         tbody.appendChild(row);
         startDate = startDate.add(7, 'day');
      }
   }

   removeFirstNWeeks(number) {
      const parent = this.dialog.querySelector("tbody");
      let scrollBy = 0;

      for (let i=0; i<number; i++) {
         const row = parent.firstElementChild;
         const month = row.querySelector('th');
         const year = month.nextSibling;
         const nextRow = row.nextSibling;

         // move month label to next row if appropriate
         if (month && month.rowSpan > 1) {
            month.rowSpan--;
            nextRow.appendChild(month);
         } else if (month) {
            // this ensures measuring the row height doesn't get
            // thrown off by the month and date columns
            // which may be taller if the text is rotated.
            row.removeChild(month);
         }

         // move year label to next row if appropriate
         if (year && year.rowSpan > 1) {
            year.rowSpan--;
            nextRow.appendChild(year);
         } else if (year) {
            row.removeChild(year);
         }

         const height = row.firstElementChild.getBoundingClientRect().height;
         parent.removeChild(row);
         scrollBy -= height;
      }

      this.dialog.scrollBy(0, scrollBy);
   }

   removeLastNWeeks(number) {
      const parent = this.dialog.querySelector("tbody");

      for (let i=0; i<number; i++) {
         const row = parent.lastElementChild;
         const startDate = dayjs(row.dataset['beginning']);

         const selector = `#M${startDate.format("YYYYMM")}`;
         const monthStartCell = parent.querySelector(selector);
         if (monthStartCell && monthStartCell !== row) {
            monthStartCell.rowSpan--;
         }

         const yearselector = `#Y${startDate.format("YYYY")}`;
         const yearStartCell = parent.querySelector(yearselector);
         if (yearStartCell && yearStartCell !== row) {
            yearStartCell.rowSpan--;
         }

         parent.removeChild(row);
      }
   }

   scrolledDialog() {
      const dialogHeight = this.dialog.getBoundingClientRect().height;
      const tableHeight = this.dialog.querySelector("table").getBoundingClientRect().height;
      const scroll = this.dialog.scrollTop;
      const bottomProximity = tableHeight - dialogHeight - scroll;

      requestAnimationFrame(() => {
         if (bottomProximity < dialogHeight * 2) {
            this.addWeeksAtEnd(26);
            this.removeFirstNWeeks(26);
         } else if (scroll < dialogHeight * 2) {
            this.addWeeksAtStart(26);
            this.removeLastNWeeks(26);
         }
      });
   }

   populateCalendar() {
      const tablebody = this.dialog.querySelector("tbody");
      tablebody.addEventListener("click", (e) => this.clickDate(e));
      const startDate = this.dateValue.subtract(52, 'week').date(1);
      this.addWeeksAtEnd(104, startDate);
   }

   popupOpenedHandler() {
      this.scrollToDate(this.dateValue);
   }

   popupClosedHandler() {
      this.tidyUpAfterClose();
   }

   scrollToDate(date) {
      const beginning = date.day(1).format("YYYY-MM-DD");
      const dialogRect = this.dialog.getBoundingClientRect();
      const tableRect = this.dialog.querySelector("table").getBoundingClientRect();
      const weekRect = this.dialog.querySelector(`[data-beginning='${beginning}']`).getBoundingClientRect();
      this.dialog.scrollTop = weekRect.top - tableRect.top - dialogRect.height/2 + weekRect.height/2;
   }

   closeDatePicker() {
      this.popup.close();
   }

   tidyUpAfterClose() {
      this.trigger.removeEventListener("keydown", this.keyboardHandler);
      this.dialog = null;
      const popup = this.shadowRoot.querySelector("se-popup#calendar");
      const popupStyle=this.shadowRoot.querySelector("style#popup");
      popup.parentNode.removeChild(popup);
      popupStyle.parentNode.removeChild(popupStyle);
      this.popupIsOpen = false;
   }

   getEventElementAndDate(event) {
      if (event.target.tagName !== 'SPAN' && event.target.tagName !== 'TD') return null;
      const target =  event.target.tagName === 'SPAN' ? event.target.parentElement : event.target;
      if (target.tagName !== 'TD') return null;

      const week = target.parentElement.dataset['beginning'];
      let date = dayjs(week);
      if (date.date() > event.target.textContent) {
         date = date.month(date.month() + 1);
      }
      date = date.date(event.target.textContent);
      return { element: target, date: date };
   }

   clickDate(event) {
      const eventData = this.getEventElementAndDate(event);
      if (eventData === null) return;
      const { element, date } = eventData;

      if (this.activeElement) this.activeElement.classList.remove('selected');
      this.value = date;
      this.activeElement = element;
      element.classList.add('selected');

      if (!this.dateValue.isSame(date, 'day')) {
         this.dateValue = date;
         this.fireDateChangeEvent(date, true);
         this.closeDatePicker();
      }
   }

   fireDateChangeEvent(date, final) {
      this.input.value = date.format("DD MMM YYYY");
      const dateChangedEvent = new Event("change");
      dateChangedEvent.final = final;
      dateChangedEvent.value = this.dateValue.format('YYYY-MM-DD');
      this.updateValue(dateChangedEvent.value);
      this.dispatchEvent(dateChangedEvent);
   }
}
window.customElements.define('se-datepicker', DatePicker);
