import { Component } from "react";

// A room rendering failure must never unmount the rest of the cabinet.
export class BuddyRoomBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("[Buddy room] Could not render the room", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <section className="buddy-room-recovery" role="alert">
      <span className="buddy-modal-kicker">ROOM / SIGNAL INTERRUPTED</span>
      <h3>Buddy’s room couldn’t open.</h3>
      <p>Your saved room is safe. Try opening it again, or return to the cabinet.</p>
      <div>
        <button type="button" onClick={() => this.setState({ failed: false })}>Try again</button>
        <button type="button" onClick={this.props.onClose}>Return to cabinet</button>
      </div>
    </section>;
  }
}
