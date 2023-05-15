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
            position: relative;
        }

        input.field {
            border: none;
            border-radius: 0.125rem 0 0 0.125rem;
            background-color: lightyellow;
            height: 1.25rem;
            vertical-align: bottom;
            margin: 0;
            width: 4rem;
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
    <div class='datepicker'>
    <input class='field' type='text' value='no selection' /><button class='trigger'>C</button>
    </div>
`;

const dialogTemplate = document.createElement('template');
dialogTemplate.innerHTML = `
   <style>
      div.dialog {
          position: absolute;
          top: 2rem;
          border: 1px solid black;
          height: 16rem;
          overflow: auto;
          scrollbar-width: none;
      }
      
      div.dialog::-webkit-scrollbar {
         background: transparent;
         width: 0;
      }
      
      div.dialog table {
      position: relative;
         border-collapse: collapse;
      }
      
      div.dialog thead,
      div.dialog tfoot {
         position: sticky;
         top: 0;
         background-color: #dddddd;
         padding: 0;
         margin: 0;
         z-index: 1;
      }
      
      div.dialog tfoot {
         bottom: 0;      
      }

      div.dialog th.month, 
      div.dialog th.year {
         vertical-align: top;
         position: relative;
      }
      
      div.dialog th.month span,
      div.dialog th.year span {
         position: sticky;
         top: 1.5rem;
      } 
      
      div.dialog td {
          text-align: center;
          min-width: 2rem;
      }
      
      div.dialog tr.oddMonth,
      div.dialog td.oddMonth, 
      div.dialog th.oddMonth {
          background-color: #eaeaea;      
      }

      div.dialog tr.evenMonth,
      div.dialog td.evenMonth,
      div.dialog th.evenMonth {
          background-color: #ffffff;      
      }
      
      

   </style>
   <div class='dialog'>
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
               <td><button id='backmonth'>Up</button></td>
               <td><button id='backyear'>Up</button></td>
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
               <td><button id='forwardmonth'>Down</button></td>
               <td><button id='forwardyear'>Down</button></td>
            </tr>
         </tfoot>
         <tbody>
         </tbody>
      </table>
   </div>
`;

export default class DatePicker extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.shadowRoot.append(datePickerTemplate.content.cloneNode(true));

      this.input = this.shadowRoot.querySelector("input.field");
      this.trigger = this.shadowRoot.querySelector("button.trigger");
      this.opener = (e) => this.openDatePicker(e);
      this.closer = (e) => this.closeDatePicker(e);
      this.scrolled = () => this.scrolledDialog();

      this.input.value = this.getAttribute('date');
      this.dateValue = dayjs(this.input.value);
      if (isNaN(this.dateValue.valueOf())) {
         this.dateValue = dayjs();
      }

      this.trigger.addEventListener('click', this.opener);

      this.opener();
   }

   openDatePicker() {
      this.trigger.removeEventListener('click', this.opener);
      this.trigger.addEventListener('click', this.closer);

      this.shadowRoot.appendChild(dialogTemplate.content.cloneNode(true));
      this.dialog = this.shadowRoot.querySelector("div.dialog");
      this.dialog.addEventListener('scroll', this.scrolled);
      const upMonth = this.shadowRoot.getElementById('backmonth');
      const upYear = this.shadowRoot.getElementById('backyear');

      this.populateCalendar(this.dialog.querySelector("tbody"), this.dateValue);
   }

   addPeriodMarker(period, id, format, klass, parent, row, startDate) {
      const periodMarker = parent.querySelector("#"+period+startDate.format(id));

      if (periodMarker) {
         periodMarker.rowSpan++;
         if (periodMarker.parentElement.dataset['beginning'] > row.dataset['beginning']) {
            row.appendChild(periodMarker);
         }
      } else {
         const monthCell = document.createElement("th");
         monthCell.id = period+startDate.format(id);
         monthCell.classList.add(klass);
         if (period === "M") {
            // const endOfWeek = startDate.add(6, 'day');
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
            if (weekday.month() !== startDate.month()) {
               cell.classList.add(weekday.month() % 2 === 0 ? "oddMonth" : "evenMonth");
            }
            cell.appendChild(document.createTextNode(weekday.format('D')));
            weekday = weekday.add(1, 'day');
            row.appendChild(cell);
         }

         const endOfWeek = startDate.add(6, 'day');
         this.addPeriodMarker("M", "YYYYMM", "MMM", 'month', parent, row, endOfWeek);
         this.addPeriodMarker("Y", "YYYY", "YYYY",'year', parent, row, endOfWeek);

         parent.insertBefore(row, first);
         this.dialog.scrollTop += first.getBoundingClientRect().height;
         first = row;
         startDate = startDate.subtract(7, 'day');
      }
   }

   addWeeksAtEnd(weeks, startDate) {
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
            if (startDate.month() !== startMonth) {
               cell.classList.add(startDate.month() % 2 === 0 ? "oddMonth" : "evenMonth");
            }
            cell.appendChild(document.createTextNode(startDate.format('D')));
            row.appendChild(cell);
            startDate = startDate.add(1, 'day');
         }

         const endOfWeek = startDate.subtract(1, 'day');
         this.addPeriodMarker("M", "YYYYMM", "MMM", 'month', parent, row, endOfWeek);
         this.addPeriodMarker("Y", "YYYY", "YYYY",'year', parent, row, endOfWeek);

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

   populateCalendar(parent, selectedDate) {
      const startDate = selectedDate.subtract(52, 'week').date(1);
      this.addWeeksAtEnd(104, startDate);
      this.scrollToDate(selectedDate);
   }

   scrollToDate(date) {
      const beginning = date.day(1).format("YYYY-MM-DD");
      const dialogRect = this.dialog.getBoundingClientRect();
      const tableRect = this.dialog.querySelector("table").getBoundingClientRect();
      const weekRect = this.dialog.querySelector(`[data-beginning='${beginning}']`).getBoundingClientRect();
      this.dialog.scrollTop = weekRect.top - tableRect.top - dialogRect.height/2 + weekRect.height/2;
   }

   closeDatePicker() {
      const dialog = this.dialog;
      this.dialog = null;
      dialog.parentNode.removeChild(dialog);

      this.trigger.removeEventListener('click', this.closer);
      this.trigger.addEventListener('click', this.opener);
   }
}
window.customElements.define('se-datepicker', DatePicker);
