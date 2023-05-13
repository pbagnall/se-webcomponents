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
         border-collapse: collapse;
      }
      
      div.dialog thead {
         position: sticky;
         top: 0;
         background-color: yellow;
         padding: 0;
         margin: 0;
         z-index: 1;
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
               <td></td>
               <td></td>
            </tr>
         </thead>
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
      this.scrolled = (e) => this.scrolledDialog(e);
      this.ignoreDownScroll = false;

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

      this.populateCalendar(this.dialog.querySelector("tbody"), this.dateValue);
   }

   addPeriodMarker(period, id, format, klass, parent, row, startDate) {
      let periodMarker = parent.querySelector("#"+period+startDate.format(id));

      if (periodMarker) {
         periodMarker.rowSpan++;
         if (periodMarker.parentElement.dataset['beginning'] > row.dataset['beginning']) {
            row.appendChild(periodMarker);
         }
      } else {
         let monthCell = document.createElement("th");
         monthCell.id = period+startDate.format(id);
         monthCell.classList.add(klass);
         let span = document.createElement('span');
         span.appendChild(document.createTextNode(startDate.format(format)));
         monthCell.appendChild(span);
         row.appendChild(monthCell);
      }
   }

   addWeeksAtStart(weeks) {
      console.log("adding rows at start");

      let parent = this.dialog.querySelector("tbody");
      let first = parent.firstElementChild;
      let startDate = dayjs(first.dataset['beginning']).subtract(7, 'day');

      for (let i=0; i<weeks; i++) {
         let row = document.createElement("tr");
         row.dataset['beginning'] = startDate.format('YYYY-MM-DD');

         let weekday = startDate;
         for (let day=0; day<7; day++) {
            let cell = document.createElement("td");
            cell.appendChild(document.createTextNode(weekday.format('D')));
            weekday = weekday.add(1, 'day');
            row.appendChild(cell);
         }

         let endOfWeek = startDate.add(6, 'day');
         this.addPeriodMarker("M", "YYYYMM", "MMM", 'month', parent, row, endOfWeek);
         this.addPeriodMarker("Y", "YYYY", "YYYY",'year', parent, row, endOfWeek);

         parent.insertBefore(row, first);
         this.dialog.scrollTop += first.getBoundingClientRect().height;
         first = row;
         startDate = startDate.subtract(7, 'day');
      }
   }

   addWeeksAtEnd(weeks, startDate) {
      let parent = this.dialog.querySelector("tbody");
      if (typeof startDate === 'undefined') {
         startDate = dayjs(parent.lastElementChild.dataset['beginning']).add(7, 'day');
      }
      startDate = startDate.day(1);

      for (let i=0; i<weeks; i++) {
         let row = document.createElement("tr");
         row.dataset['beginning'] = startDate.format('YYYY-MM-DD');

         for (let day=0; day<7; day++) {
            let cell = document.createElement("td");
            cell.appendChild(document.createTextNode(startDate.format('D')));
            startDate = startDate.add(1, 'day');
            row.appendChild(cell);
         }

         let endOfWeek = startDate.subtract(1, 'day');
         this.addPeriodMarker("M", "YYYYMM", "MMM", 'month', parent, row, endOfWeek);
         this.addPeriodMarker("Y", "YYYY", "YYYY",'year', parent, row, endOfWeek);

         parent.appendChild(row);
      }
   }

   removeFirstNWeeks(number) {
      let parent = this.dialog.querySelector("tbody");

      for (let i=0; i<number; i++) {
         let row = parent.firstElementChild;
         let month = row.querySelector('th');
         let year;
         if (month) {
            year = month.nextSibling;
            if (month.rowSpan > 1) {
               month.rowSpan--;
               // get next row
               // insert month into next row at end
               let nextRow = row.nextSibling;
               nextRow.appendChild(month);
            }
         }

         // remove year, if present
         if (year) {
            if (year.rowSpan > 1) {
               year.rowSpan--;
               // get next row
               // insert month into next row at end
               let nextRow = row.nextSibling;
               nextRow.appendChild(year);
            }
         }

         let height = row.getBoundingClientRect().height;
         parent.removeChild(row);
         this.dialog.scrollTop -= height;
      }
   }

   removeLastNWeeks(parent, number) {
   }

   scrolledDialog(scrollEvent) {
      let dialogHeight = this.dialog.getBoundingClientRect().height;
      let tableHeight = this.dialog.querySelector("table").getBoundingClientRect().height;
      let scroll = this.dialog.scrollTop;
      let bottomProximity = tableHeight - dialogHeight - scroll;

      if (bottomProximity < 80) {
         // get last week row
         this.addWeeksAtEnd(4);
         this.removeFirstNWeeks(4);
      } else if (scroll < 80) {
         // get first week row
         this.addWeeksAtStart(4);
         this.removeLastNWeeks(4);
      }
   }

   populateCalendar(parent, selectedDate) {
      const startDate = selectedDate.subtract(12, 'week').date(1);
      this.addWeeksAtEnd(24, startDate);
      this.scrollToDate(selectedDate);
   }

   scrollToDate(date) {
      const parent = this.dialog.querySelector("tbody");
      const beginning = date.day(1).format("YYYY-MM-DD");
      const weekRow = parent.querySelector(`[data-beginning='${beginning}']`);
      const weekTop = weekRow.getBoundingClientRect();
      console.log(weekTop);
      console.log(parent.getBoundingClientRect());
      parent.scrollTop = weekTop
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
