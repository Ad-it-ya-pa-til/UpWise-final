import React from 'react'
import { UpwiseLogo, UpwiseLogoProps } from './UpwiseLogo'

export { UpwiseLogo }
export type { UpwiseLogoProps }

export interface SunLogoProps extends UpwiseLogoProps {}

export const SunLogo: React.FC<SunLogoProps> = (props) => {
  return <UpwiseLogo {...props} />
}
