exports.isValidImage = (mimetype) => {
    return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimetype);
  };
  