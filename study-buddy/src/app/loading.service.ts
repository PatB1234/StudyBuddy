import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
    // Mostly responsible for handling the overlay effect when the flashcards are loading and stuff
    // The overlay exists on the whole page, it is just activated or deactivated as needed by the respective page
    private _isLoading = new BehaviorSubject<boolean>(false);
    private _message = new BehaviorSubject<string>('');

    isLoading$ = this._isLoading.asObservable();
    message$ = this._message.asObservable();

    start(message: string): void {
        this._message.next(message);
        this._isLoading.next(true);
    }

    stop(): void {
        this._isLoading.next(false);
    }
}
