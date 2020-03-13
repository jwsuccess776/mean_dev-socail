import { Component, OnInit, ViewChild, Input } from '@angular/core'
import { MatPaginator } from '@angular/material/paginator'
import { MatSort } from '@angular/material/sort'
import { MatTableDataSource } from '@angular/material/table'
import { ChartDataSets, ChartOptions } from 'chart.js'
import { Color, Label } from 'ng2-charts'
import * as moment from 'moment'
import * as _ from 'lodash'

@Component({
  selector: 'app-admin-video-table',
  templateUrl: './admin-video-table.component.html',
  styleUrls: ['./admin-video-table.component.scss']
})
export class AdminVideoTableComponent implements OnInit {

  @Input() videos: any

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  public date = new Date()
  public monthFirstDay = new Date(this.date.getFullYear(), this.date.getMonth(), 1);
  public monthLastDay = new Date(this.date.getFullYear(), this.date.getMonth() + 1, 0);
  public arrayofDays = this.getDates(this.monthFirstDay, this.monthLastDay, 'YYYY-MM-DD')
  public momentDate = moment(this.date).format('MMMM-YYYY')

  public displayedColumns: string[] = ['title', 'createdAt', 'views', 'rate', 'duration', 'status', 'delete', 'options']
  public dataSource: MatTableDataSource<any>
  public video: any

  constructor(
    // public api: CreatorSpaceService
  ) { }

  showStatistics(video) {
    this.video = video
    const timestamps = _(this.video.views).map(view => view.viewsTimestamps).flatten().value()

    const values = this.getMonthActivity(timestamps, 'date')
    const viewsData = new Array(this.lineChartLabels.length).fill(0)
    const viewsDuration = new Array(this.lineChartLabels.length).fill(0)

    this.arrayofDays.forEach((day, index) => {
      viewsData[index] = values[day] ? values[day].reduce((accumulator, currentValue) => accumulator + 1, 0) : 0
    })
    this.arrayofDays.forEach((day, index) => {
      viewsDuration[index] = values[day] ? values[day].reduce((accumulator, currentValue) => accumulator + currentValue.duration, 0) : 0
    })

    this.lineChartData[0].data = viewsData
    this.lineChartData[1].data = viewsDuration
  }

  async activate($event, id) {
    try {
      const status = $event.checked
      // await this.api.toggleVideoStatus(id, status)
    } catch (e) {
      console.log(e)
    }
  }

  async deleteVideo(id: string) {
    try {
      const state = confirm(`Deleting a video can not be undone. Note that you can always set your videos to private to hide them. Are you sure you want to proceed?`)
      // if (state)
        // await this.api.deleteVideo(id)
    } catch (e) {
      console.log(e)
    }
  }

  toggleView() {
    this.video = null
  }

  async ngOnInit() {
    this.videos.forEach((video: any) => {
      video.totalViews = video.views.map(view => view.viewCounter).reduce((a, b) => a + b)
      video.totalRate = Math.round((video.likes.filter(like => like.status).length / video.likes.length) * 100)
    })
    this.dataSource = new MatTableDataSource(this.videos)
    this.dataSource.paginator = this.paginator
    this.dataSource.sort = this.sort
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public getDates(startDate, stopDate, format) {
    const dateArray = [];
    let currentDate = moment(startDate);
    const $stopDate = moment(stopDate);
    while (currentDate <= $stopDate) {
      dateArray.push(moment(currentDate).format(format))
      currentDate = moment(currentDate).add(1, 'days');
    }
    return dateArray;
  }

  public getMonthActivity(arr, key) {
    const obj = {}
    arr.forEach(value => {
      const int = moment(value[key]).format('YYYY-MM-DD')
      obj[int] ? obj[int].push(value) : obj[int] = [value]
    })
    return obj
  }

  public lineChartData: ChartDataSets[] = [
    {
      data: [],
      fill: false,
      label: "Views"
    },
    {
      data: [],
      fill: false,
      label: "Watch Time (s)"
    }
  ]
  public lineChartLabels: Label[] = this.getDates(this.monthFirstDay, this.monthLastDay, 'dd-Do')
  public lineChartOptions: ChartOptions = {
    responsive: true,
    scales: {
      gridLines: {
        display: false
      }
    },
    maintainAspectRatio: false,
    legend: {
      display: false
    }
  };
  public lineChartColors: Color[] = [
    {
      backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    }
  ];
  public lineChartLegend = true;
  public lineChartType = 'line';

}
