import React, { PureComponent } from 'react';
import ImageEditor from './ImageEditor';

class PS extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      imageURL: null,
    };
  }

  componentDidMount() {
    const image = require('assets/yay.jpg');
    this.setState({ imageURL: image });
  }

  upload = dataURL => {
    const dlLink = document.createElement('a');
    dlLink.download = 'fileName';
    dlLink.href = dataURL;
    dlLink.dataset.downloadurl = ['image/png', dlLink.download, dlLink.href].join(':');
    document.body.appendChild(dlLink);
    dlLink.click();
    document.body.removeChild(dlLink);
  };

  render() {
    return (
        <div style={{ height: '100vh' }}>
          <ImageEditor
            imageURL={this.state.imageURL}
            upload={this.upload}
          />
        </div>
    );
  }
}

export default PS;
