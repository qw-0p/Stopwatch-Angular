
import { Component, OnDestroy, OnInit } from "@angular/core";
import { interval, merge, NEVER, Observable, Subject, Subscription } from "rxjs";
import {
  buffer,
  debounceTime,
  filter,
  map,
  scan,
  startWith,
  switchMap,
  tap
} from "rxjs/operators";

interface State {
  current: number;
  count: boolean;
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit, OnDestroy{
  state: State = { current: 0, count: false };
  togler$ = new Subject();
  wait$ = new Subject();
  reset$ = new Subject();
  doubleClick: Observable<any> | undefined
  output: {
    h: string,
    m: string,
    s: string
  } = {
    h: '00', m: '00', s: '00'
  };
  state$: Subscription = new Subscription;

  ngOnInit() {
     const events$ = merge(
      this.togler$.pipe(
        map(() => {
          return this.state.count
            ? { current: 0, count: false }
            : { ...this.state, count: true };
        })
      ),
      this.wait$.pipe(
        buffer(this.wait$.pipe(debounceTime(300))),
        filter(x => x.length > 1),
        map(() => ({...this.state, count: false}))
      ),
      this.reset$.pipe(map(() => ({ current: 0, count: true })))
    );

    this.state$ = events$
      .pipe(
        startWith({ current: 0, count: false }),
        scan((state: State, curr: State): State => ({ ...state, ...curr }), {} as State),
        tap(ev => {
          this.setState(ev);
        }),
        switchMap((x: State) => {
          return x.count ?
             interval(100).pipe(
                tap(ev => {
                  this.setState({ current: x.current + ev + 1 })
                  })
              )
            : NEVER
        })
      )
      .subscribe();
  }

  ngOnDestroy(){
    this.state$.unsubscribe();
  }

  
  private setState(x: any) {
    this.state = { ...this.state, ...x };
    this.output = this.convertTimer(this.state.current)
  }
  convertTimer(current: number) {
    return {
      h: Math.floor(current/10/60/60).toString().padStart(2, '0'),
      m: Math.floor(current/10/60).toString().padStart(2, '0'),
      s: Math.floor(current/10 % 60).toString().padStart(2, '0')
    }
  }

  wait() {
    this.wait$.next(true);
  }

  onClick() {
    this.togler$.next();
  }

  reset() {
    this.reset$.next();
  }
}
