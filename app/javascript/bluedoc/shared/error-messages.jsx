export default class ErrorMessages extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hidden: false,
    };
  }

  dismiss = (e) => {
    e.preventDefault();
    this.setState({ hidden: true });
    return false;
  }

  render() {
    const { messages } = this.props;
    const { hidden } = this.state;

    if (hidden || messages.length === 0) {
      return null;
    }

    return (
      <div className="flash flash-block flash-error">
        <div className="mb-1"><strong>{i18n.t("There has count issues", { count: messages.length })}</strong></div>
        <ul className="list-style-none">
          {messages.map(message => <li>{message}</li>)}
        </ul>
      </div>
    );
  }
}
