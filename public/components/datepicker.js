import '/components/popup.js';

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
            /*position: relative;*/
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
        
        input.field:focus {
            outline: none;
        }

        div.datepicker:has(input.field:focus) {
            outline: Highlight auto 2px ;
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
        }
        
        div.datepicker:hover button.trigger        { background-color: #cccccc; }
        div.datepicker       button.trigger:active { background-color: #aaaaaa; }
    </style>
    <div class='datepicker' id='date-picker'>
    <input class='field' type='text' value='no selection' /><button class='trigger'>C</button>
    </div>
`;

const dialogTemplate = document.createElement('template');
dialogTemplate.innerHTML = `
   <style id='popup'>
      #container {
          --oddMonthBackground: #eaeaea;
          --evenMonthBackground: #ffffff;
          --toolbarBackground: #d0d0d0;
          --foreground: #000000;
          --hoverColor: #ffffff;
          --hoverBackgroundColor: #ff000080;
          --selectedColor: #ffffff;
          --selectedBackgroundColor: #ff0000;
          --todayBorderColor: orange;

          top: 2rem;
          height: 16rem;
          color: var(--foreground);
          overflow: auto;
          scrollbar-width: none;
          font-size: 0.8em;
          font-family: Avenir;
      }
      
      #container::-webkit-scrollbar {
         width: 0;
         background: transparent;
      }
      
      se-popup::-webkit-scrollbar {
         background: transparent;
         width: 0;
      }
      
      se-popup table {
         position: relative;
         border-spacing: 0;
         border-collapse: collapse;
         margin: 0;
      }
      
      se-popup thead,
      se-popup tfoot {
         position: sticky;
         top: 0;
         background-color: var(--toolbarBackground);
         padding: 0;
         margin: 0;
         z-index: 1;
      }
      
      se-popup thead button,
      se-popup tfoot button {
        height: 1.1rem;
        font-family: Avenir;
        font-size: 0.8rem;
      }
      
      se-popup tfoot {
         bottom: 0;      
      }

      se-popup th.month, 
      se-popup th.year {
         vertical-align: top;
         position: relative;
      }
      
      se-popup th.month span,
      se-popup th.year span {
         position: sticky;
         top: 1.5rem;
         writing-mode: vertical-lr;
         text-orientation: sideways;
         padding: 3px;
      } 
      
      se-popup tr.oddMonth,
      se-popup td.oddMonth, 
      se-popup th.oddMonth {
          background-color: var(--oddMonthBackground);      
      }

      se-popup tr.evenMonth,
      se-popup td.evenMonth,
      se-popup th.evenMonth {
          background-color: var(--evenMonthBackground);      
      }
      
      se-popup td {
          padding: 2px;
          margin-left: 2px;
          text-align: center;
          min-width: 2.2em;
      }
      
      se-popup td span {
          display: inline-block;
          width: calc(100% - 4px);
          border-radius: 40px;
          border-color: transparent;
      }

      se-popup td:hover span {
          color: var(--hoverColor);
          background-color: var(--hoverBackgroundColor);
      }
      
      se-popup td.selected span {
          color: var(--selectedColor);
          background-color: var(--selectedBackgroundColor);
      }
      
      se-popup td.today span {
          border: 2px solid var(--todayBorderColor);
          padding: 0;
          margin: 0;
      }
   </style>
   <se-popup anchor='date-picker' anchor-direction='se,sw,ne,nw'>
      <div id='container'>
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
                  <td><button id='backmonth' data-direction="back" data-unit="month">^</button></td>
                  <td><button id='backyear' data-direction="back" data-unit="year">^</button></td>
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
                  <td><button id='forwardmonth' data-direction="forward" data-unit="month">v</button></td>
                  <td><button id='forwardyear' data-direction="forward" data-unit="year">v</button></td>
               </tr>
            </tfoot>
            <tbody>
            </tbody>
      </table>
      </div>
   </se-popup>
`;

export default class DatePicker extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.shadowRoot.append(datePickerTemplate.content.cloneNode(true));

      this.input = this.shadowRoot.querySelector("input.field");
      this.trigger = this.shadowRoot.querySelector("button.trigger");
      this.scrolled = () => this.scrolledDialog();
      this.popupOpened = () => this.popupOpenedHandler();
      this.popupClosed = () => this.popupClosedHandler();

      this.dateValue = dayjs(this.attributes['date'].value);
      if (isNaN(this.dateValue.valueOf())) {
         this.dateValue = dayjs();
      }
      this.input.value = this.dateValue.format("DD MMM YYYY");

      this.trigger.addEventListener('click', () => this.triggerClicked());
      this.popupIsOpen = false;

      if (this.hasAttribute('open')) {
         this.openDatePicker();
      }
   }

   triggerClicked() {
      console.log("triggerClicked");
      if (this.popupIsOpen) {
         this.closeDatePicker();
      } else {
         this.openDatePicker();
      }
   }

   openDatePicker() {
      console.log("opening");
      this.shadowRoot.appendChild(dialogTemplate.content.cloneNode(true));
      this.popupIsOpen = true;
      this.popup = this.shadowRoot.querySelector("se-popup");
      this.dialog = this.shadowRoot.querySelector("#container");
      this.dialog.addEventListener('scroll', this.scrolled);
      const upMonth = this.shadowRoot.getElementById('backmonth');
      const upYear = this.shadowRoot.getElementById('backyear');
      const downMonth = this.shadowRoot.getElementById('forwardmonth');
      const downYear = this.shadowRoot.getElementById('forwardyear');
      const jumpScroll = (e) => this.jumpScroll(e);
      upMonth.addEventListener("click", jumpScroll);
      upYear.addEventListener("click", jumpScroll);
      downMonth.addEventListener("click", jumpScroll);
      downYear.addEventListener("click", jumpScroll);

      this.populateCalendar();
      this.popup.addEventListener("open", this.popupOpened);
      this.popup.addEventListener("close", this.popupClosed);
      this.popup.open();
   }

   jumpScroll(event) {
      // get the currently displayed date (not the same as the current selection)

      // adjust by some amount, forwards/back one month/year

      // wipe the calendar and rebuild around that date

      // scroll to that date
   }

   addPeriodMarker(period, startOrEnd, id, format, klass, parent, row, startDate) {
      const periodMarker = parent.querySelector("#"+period+startDate.format(id));

      // Does the period marker already exist?
      // If so
      if (periodMarker) {
         periodMarker.rowSpan++;
         if (periodMarker.parentElement.dataset['beginning'] > row.dataset['beginning']) {
            row.appendChild(periodMarker);
         }
      } else {
         const monthCell = document.createElement("th");
         monthCell.id = period+startDate.format(id);
         monthCell.classList.add(klass);
         monthCell.classList.add(startOrEnd);
         if (period === "M") {
            monthCell.classList.add(startDate.month() % 2 === 0 ? "oddMonth" : "evenMonth");
         } else {
            monthCell.classList.add(startDate.year() % 2 === 0 ? "oddMonth" : "evenMonth");
         }
         const span = document.createElement('span');
         span.appendChild(document.createTextNode(startDate.format(format)));
         monthCell.appendChild(span);
         row.appendChild(monthCell);
      }
   }

   addWeeksAtStart(weeks) {
      const parent = this.dialog.querySelector("tbody");
      const today = dayjs();
      let first = parent.firstElementChild;
      let startDate = dayjs(first.dataset['beginning']).subtract(7, 'day');

      for (let i=0; i<weeks; i++) {
         const row = document.createElement("tr");
         const startMonth = startDate.month();
         row.classList.add(startMonth % 2 === 0 ? "oddMonth" : "evenMonth");
         row.dataset['beginning'] = startDate.format('YYYY-MM-DD');

         let weekday = startDate;
         for (let day=0; day<7; day++) {
            const cell = document.createElement("td");
            if (weekday.isSame(today, 'day')) cell.classList.add("today");
            if (weekday.isSame(this.dateValue, 'day')) cell.classList.add("selected");
            if (weekday.month() !== startDate.month()) {
               cell.classList.add(weekday.month() % 2 === 0 ? "oddMonth" : "evenMonth");
            }

            const span = document.createElement("span");
            span.appendChild(document.createTextNode(weekday.format('D')));
            cell.appendChild(span);
            row.appendChild(cell);
            weekday = weekday.add(1, 'day');
         }

         const endOfWeek = startDate.add(6, 'day');
         this.addPeriodMarker("M", "start", "YYYYMM", "MMM", 'month', parent, row, endOfWeek);
         this.addPeriodMarker("Y", "start", "YYYY", "YYYY",'year', parent, row, endOfWeek);

         parent.insertBefore(row, first);
         this.dialog.scrollTop += first.getBoundingClientRect().height;
         first = row;
         startDate = startDate.subtract(7, 'day');
      }
   }

   addWeeksAtEnd(weeks, startDate) {
      const today = dayjs();
      const parent = this.dialog.querySelector("tbody");
      if (typeof startDate === 'undefined') {
         startDate = dayjs(parent.lastElementChild.dataset['beginning']).add(7, 'day');
      }
      startDate = startDate.day(1);

      for (let i=0; i<weeks; i++) {
         const row = document.createElement("tr");
         const startMonth = startDate.month();
         row.classList.add(startMonth % 2 === 0 ? "oddMonth" : "evenMonth");
         row.dataset['beginning'] = startDate.format('YYYY-MM-DD');

         for (let day=0; day<7; day++) {
            const cell = document.createElement("td");
            if (startDate.isSame(today, 'day')) cell.classList.add("today");
            if (startDate.isSame(this.dateValue, 'day')) cell.classList.add("selected");
            if (startDate.month() !== startMonth) {
               cell.classList.add(startDate.month() % 2 === 0 ? "oddMonth" : "evenMonth");
            }
            const span = document.createElement("span");
            span.appendChild(document.createTextNode(startDate.format('D')));
            cell.appendChild(span);
            row.appendChild(cell);
            startDate = startDate.add(1, 'day');
         }

         const endOfWeek = startDate.subtract(1, 'day');
         this.addPeriodMarker("M", "end", "YYYYMM", "MMM", 'month', parent, row, endOfWeek);
         this.addPeriodMarker("Y", "end", "YYYY", "YYYY",'year', parent, row, endOfWeek);

         parent.appendChild(row);
      }
   }

   removeFirstNWeeks(number) {
      const parent = this.dialog.querySelector("tbody");

      for (let i=0; i<number; i++) {
         const row = parent.firstElementChild;
         const month = row.querySelector('th');

         // move month label to next row if appropriate
         if (month && month.rowSpan > 1) {
            const nextRow = row.nextSibling;
            const year = month.nextSibling;

            month.rowSpan--;
            nextRow.appendChild(month);

            // move year label to next row if appropriate
            if (year && year.rowSpan > 1) {
               year.rowSpan--;
               nextRow.appendChild(year);
            }
         }

         const height = row.getBoundingClientRect().height;
         parent.removeChild(row);
         this.dialog.scrollTop -= height;
      }
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

      if (bottomProximity < 200) {
         // get last week row
         this.addWeeksAtEnd(26);
         this.removeFirstNWeeks(26);
      } else if (scroll < 200) {
         // get first week row
         this.addWeeksAtStart(26);
         this.removeLastNWeeks(26);
      }
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
      console.log("closing");
      this.popup.close();
   }

   tidyUpAfterClose() {
      console.log("tidying up");
      this.dialog = null;
      const popup = this.shadowRoot.querySelector("se-popup");
      const popupStyle=this.shadowRoot.querySelector("style#popup");
      popup.parentNode.removeChild(popup);
      popupStyle.parentNode.removeChild(popupStyle);
      this.popupIsOpen = false;
   }

   getEventElementAndDate(event) {
      if (event.target.tagName !== 'SPAN' && event.target.tagName !== 'TD') return null;
      const target =  event.target.tagName === 'SPAN' ? event.target.parentElement : event.target;
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
         this.input.value = date.format("DD MMM YYYY");
         const dateChangedEvent = new Event("change");
         dateChangedEvent.value = this.dateValue.format('YYYY-MM-DD');
         this.dispatchEvent(dateChangedEvent);
         this.closeDatePicker();
      }
   }
}
window.customElements.define('se-datepicker', DatePicker);
