var React = require('react');
var ReactDOMServer = require('react-dom/server');
var serialize = require('serialize-javascript');

function omit(source, filterList) {
  return Object.keys(source).reduce(function (prev, curr) {
    if (filterList.indexOf(curr) !== -1) {
      prev[curr] = source[curr];
    }
    return prev;
  }, {});
}

function DefaultLayout(props) {
  var View = props.View;
  var rest = omit(props, ['View']);
  var safeProps = sanitizeProps(rest);
  var html = ReactDOMServer.renderToString(
    React.createElement(View, safeProps)
  );

  return (
    <html>
      <head>
        <title>{'default'}</title>
        <meta charSet="utf-8"/>
        <meta content="IE=edge" httpEquiv="X-UA-Compatible"/>
        <meta content="width=device-width, initial-scale=1" name="viewport"/>
      </head>
      <body>
        {/* eslint-disable react/no-danger */}
        <main id="outlet" dangerouslySetInnerHTML={{ __html: html }} />
        <script dangerouslySetInnerHTML={{__html: safeProps}} />
        {/* eslint-enable react/no-danger */}
      </body>
    </html>
  );
}

DefaultLayout.propTypes = {
  View: React.PropTypes.func
};

export default DefaultLayout

