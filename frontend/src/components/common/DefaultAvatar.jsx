import React from "react";

export const DEFAULT_AVATAR_URL = "/defaultpfp.png";

const DefaultAvatar = ({ src, alt, className, style, size = 40 }) => {
  const [imgSrc, setImgSrc] = React.useState(src || DEFAULT_AVATAR_URL);

  React.useEffect(() => {
    setImgSrc(src || DEFAULT_AVATAR_URL);
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt || "User Avatar"}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        ...style,
      }}
      onError={() => setImgSrc(DEFAULT_AVATAR_URL)}
    />
  );
};

export default DefaultAvatar;
