import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared/shared.module';
import packageInfo from '../../../../package.json';
import { BadgeModule } from 'primeng/badge';
import { FileUploadComponent } from '../toolbar/file-upload/file-upload.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [SharedModule, BadgeModule, FileUploadComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  appName = packageInfo.name;
  appVersion = packageInfo.version;
}
