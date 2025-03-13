import { computed, Injectable, signal, Signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SignalsSimpleStoreService<T> {
  readonly state = signal({} as T);

  /**
   * Returns a reactive value for a property on the state.
   * This is used when the consumer needs the signal for
   * specific part of the state.
   *
   * @param key - the key of the property to be retrieved
   */
  public select<K extends keyof T>(key: K): Signal<T[K]> {
    return computed(() => this.state()[key]);
  }

  public getValue<K extends keyof T>(key: K): T[K] {
    return this.select(key)();
  }

  /**
   * This is used to set a new value for a property
   *
   * @param key - the key of the property to be set
   * @param data - the new data to be saved
   */
  public set<K extends keyof T>(key: K, data: T[K]) {
    this.state.update((currentValue: any) => ({ ...currentValue, [key]: data }));
  }

  /**
   * Sets values for multiple properties on the store
   * This is used when there is a need to update multiple
   * properties in the store
   *
   * @param partialState - the partial state that includes
   *                      the new value to be saved
   */
  public setState(partialState: Partial<T>): void {
    this.state.update((currentValue: any) => ({ ...currentValue, ...partialState }));
  }
}
