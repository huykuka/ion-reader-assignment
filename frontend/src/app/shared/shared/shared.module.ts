import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { RippleModule } from 'primeng/ripple';
import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SliderModule } from 'primeng/slider';
import { CardModule } from 'primeng/card';

const PRIMENG_MODULES = [
  RippleModule,
  ButtonModule,
  AccordionModule,
  FileUploadModule,
  TableModule,
  FloatLabelModule,
  BadgeModule,
  SelectModule,
  SliderModule,
  CardModule,
];
@NgModule({
  declarations: [],
  imports: [CommonModule, ...PRIMENG_MODULES],
  exports: [...PRIMENG_MODULES],
})
export class SharedModule {}
