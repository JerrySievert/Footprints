'use strict';

class Span {
  constructor(span) {
    this.span = span;
    this.children = [];
    this.current = -1;
  }

  addChild(child) {
    this.children.push(child);
    this.children = this.children.sort(
      (a, b) => a.span.startTimeUnixNano - b.span.startTimeUnixNano
    );
  }

  next() {
    if (this.current === this.children.length) {
      return;
    }

    if (this.current === -1) {
      this.current = 0;

      return this.children[this.current]?.span;
    }

    let next_child = this.children[this.current].next();
    if (next_child) {
      return next_child;
    }

    this.current++;

    return this.children[this.current]?.span;
  }
}

class SpanTree {
  constructor(spans, parent = null) {
    const orphans = [];
    const parents = {};
    const children = {};
    this.current = -1;

    for (const span of spans) {
      if (!span.parentSpanId) {
        const parent = new Span(span);

        parents[span.spanId] = parent;
      } else {
        if (parents[span.parentSpanId]) {
          const child = new Span(span);
          parents[span.parentSpanId].addChild(child);

          children[span.spanId] = child;
        } else if (children[span.parentSpanId]) {
          const child = new Span(span);
          children[span.parentSpanId].addChild(child);

          children[span.spanId] = child;
        } else {
          orphans.push(span);
        }
      }
    }

    // find any orphans that might still be here.
    for (const span of orphans) {
      if (parents[span.parentSpanId]) {
        const child = new Span(span);
        parents[span.parentSpanId].addChild(child);

        children[span.spanId] = child;
      } else if (children[span.parentSpanId]) {
        const child = new Span(span);
        children[span.parentSpanId].addChild(child);

        children[span.spanId] = child;
      } else {
        const parent = new Span(span);

        parents[span.spanId] = parent;

        children[span.spanId] = parent;
      }
    }

    this.children = Object.values(parents).sort((a, b) =>
      Number(
        BigInt(a.span.startTimeUnixNano) - BigInt(b.span.startTimeUnixNano)
      )
    );
  }

  next() {
    if (this.current === this.children.length) {
      return;
    }

    if (this.current === -1) {
      this.current = 0;

      return this.children[this.current].span;
    }

    let next_child = this.children[this.current].next();
    if (next_child) {
      return next_child;
    }

    this.current++;

    return this.children[this.current]?.span;
  }

  *[Symbol.iterator]() {
    let span;
    while ((span = this.next())) {
      yield span;
    }
  }
}

// builds an iterator of a tree.
const spans_in_order = (trace) => {
  return new SpanTree(trace.spans);
};

export { spans_in_order };
