# se-datepicker

This is an experiment to build a high quality date picker, using web 
components. It is very much a work in progress! See the issues for what 
still remains to be done.

## Design objective

Date pickers have a few problems

* They tend to be month oriented, but life is more typically week oriented
* They page between months, which causes problems with partial weeks at the ends
  of months
* Time in continuous which makes paging a bad solution anyway
* When entering dates as text they are over-prescriptive of format
* They should be accessible
* They don't show context, which is often very important when picking a date

This is my attempt to solve those problems in a Web Component

## Trying it out

If you want to try the demo, then clone the code to your local machine and then
from inside the project directory do

`npm ci`

and then

`npm run demo`

That will build the code, and start a server and open a browser on the index
page.
