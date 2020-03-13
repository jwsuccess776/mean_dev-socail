import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PaymentService } from '../../../services/payment.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddProductComponent } from './add-product/add-product.component'

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  public products: any
  public loaded: boolean
  public error: boolean
  public displayedColumns: string[] = ['id', 'name', 'active', 'type', 'created', 'options']
  public dataSource: MatTableDataSource<any>

  constructor(
    public paymentService: PaymentService,
    public dialog: MatDialog
  ) { }

  private async loadProducts() {
    try {
      const products: any = await this.paymentService.stripeGetProducts()
      this.products = products.data
      this.dataSource = new MatTableDataSource(this.products)
      this.dataSource.paginator = this.paginator
      this.dataSource.sort = this.sort
      this.loaded = true
      return Promise.resolve(this.products)
    } catch (e) {
      console.log(e)
      this.error = true
      return Promise.reject(e)
    }
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  async ngOnInit() {
    await this.loadProducts()
  }

  addProduct(): void {
    this.dialog.open(AddProductComponent, {
      width: '900px'
    })
  }

}
