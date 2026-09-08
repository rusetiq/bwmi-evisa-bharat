import { Component, type ReactNode } from 'react'

export class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }

  render() {
    if (!this.state.failed) return this.props.children
    return <main id="main-content" tabIndex={-1} className="shell min-h-[70vh] py-20">
      <h1 className="display text-4xl">This page couldn’t load.</h1>
      <p role="alert" className="my-6">Check your connection and reload. Your previously saved application is still available.</p>
      <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reload page</button>
      <a href="/" className="link ml-6">Return home</a>
    </main>
  }
}
