export const makeStyledIcon = (Icon) => {
  return ({ size = '24px', color, ...restProps }) => {
    const iconColor = color || 'grey';

    return <Icon width={size} height={size} color={iconColor} {...restProps} />;
  };
};
