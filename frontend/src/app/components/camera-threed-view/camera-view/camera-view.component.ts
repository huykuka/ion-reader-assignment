import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { TopicService } from '../../../services/state/topic.service';
import { CommonModule } from '@angular/common';
import { ImageDecodingService } from '../../../core/services/image-decoding.service';
import { Topic } from '../../../core/models/topic.model';
import { PlaybackService } from '../../../services/actions/playback.service';
import { Subscription } from 'rxjs';
import { SessionService } from '../../../services';
import dayjs from 'dayjs';

interface DecodedImage {
  url: string;
  timestamp: number;
}

@Component({
  selector: 'app-camera-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './camera-view.component.html',
  styleUrls: ['./camera-view.component.scss'],
})
export class CameraViewComponent implements OnInit, OnDestroy {
  topicService = inject(TopicService);
  imageDecodingService = inject(ImageDecodingService);
  playbackService = inject(PlaybackService);
  sessionService = inject(SessionService);

  topics = computed(() => this.topicService.getValue('topics'));
  compresImageTopic = computed(() =>
    this.topics()?.find((topic: Topic) =>
      topic.topicType?.toLowerCase().includes('compressedimage')
    )
  );

  imageUrl: string | null = null;
  decodedImages: DecodedImage[] = [];
  isDecoding = false;
  private playbackSubscription: Subscription | null = null;

  constructor() {
    effect(() => {
      if (this.compresImageTopic()) {
        this.processAllImageData();
      }
    });
  }

  ngOnInit() {
    // Subscribe to playback value changes
    this.playbackSubscription = this.playbackService.$playbackValue.subscribe(
      (playbackValue) => {
        this.updateImageBasedOnPlayback(playbackValue);
      }
    );
  }

  ngOnDestroy() {
    // Clean up subscriptions and image URLs
    if (this.playbackSubscription) {
      this.playbackSubscription.unsubscribe();
    }

    // Revoke all object URLs to prevent memory leaks
    this.decodedImages.forEach((image) => {
      URL.revokeObjectURL(image.url);
    });
  }

  processAllImageData() {
    const topic = this.compresImageTopic();
    if (!topic || !topic.messages || topic.messages.length === 0) {
      return;
    }

    // Clear previous decoded images and revoke their URLs
    this.decodedImages.forEach((image) => {
      URL.revokeObjectURL(image.url);
    });
    this.decodedImages = [];

    this.isDecoding = true;

    // Process each message
    const processPromises = topic.messages.map((message) => {
      if (!message || !message.data || !message.data.data) {
        return Promise.resolve();
      }

      const imageData = message.data.data;

      // If we have image data, process it
      if (typeof imageData === 'string') {
        return this.imageDecodingService
          .convertToBGR8JpegImage(imageData)
          .then((blob) => {
            // Create a URL for the blob
            const url = URL.createObjectURL(blob);
            this.decodedImages.push({
              url,
              timestamp: message.timestamp || 0,
            });
          })
          .catch((error) => {
            console.error('Error decoding image:', error);
          });
      }

      return Promise.resolve();
    });

    // When all images are processed
    Promise.all(processPromises)
      .then(() => {
        // Sort images by timestamp
        this.decodedImages.sort((a, b) => a.timestamp - b.timestamp);

        // Set the total duration for the playback service
        if (this.decodedImages.length > 0) {
          // Display the first image
          this.imageUrl = this.decodedImages[0].url;
        }

        this.isDecoding = false;
      })
      .catch((error) => {
        console.error('Error processing images:', error);
        this.isDecoding = false;
      });
  }

  updateImageBasedOnPlayback(_playbackValue: number) {
    if (this.decodedImages.length === 0) {
      return;
    }

    const targetTimestamp =
      _playbackValue * 1000 +
      dayjs.utc(this.sessionService.getSession()?.start_time).valueOf();

    let closestImage: DecodedImage | null = null;
    let minDifference = Number.MAX_VALUE;

    for (const image of this.decodedImages) {
      const difference = Math.abs(image.timestamp - targetTimestamp);
      if (difference < minDifference) {
        minDifference = difference;
        closestImage = image;
      }
    }

    if (closestImage) {
      this.imageUrl = closestImage.url;
    }
  }
}
