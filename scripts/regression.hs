{-# LANGUAGE OverloadedStrings #-}

import Data.Aeson
import Data.Aeson.Encode.Pretty
import Data.Vector (fromList)
import Control.Monad
import Control.Applicative
import Statistics.LinearRegression
import qualified Data.ByteString.Lazy as ByteString

data GeoPoint =
    GeoPoint { geoX :: Double
             , geoY :: Double
             , lng  :: Double
             , lat  :: Double
             } deriving (Show)
             
data GeoRegression =
    GeoRegression { a :: Double
                  , b :: Double
                  } deriving (Show)
                  
data GeoScales =
    GeoScales { geoXScale :: GeoRegression
              , geoYScale :: GeoRegression
              } deriving (Show)

instance FromJSON GeoPoint where
    parseJSON (Object v) =
        GeoPoint <$> ((v .: "input") >>= (.: "geoX"))
                 <*> ((v .: "input") >>= (.: "geoY"))
                 <*> ((v .: "output") >>= (.: "lng"))
                 <*> ((v .: "output") >>= (.: "lat"))
    parseJSON _ = 
        mzero
        
instance ToJSON GeoRegression where
    toJSON (GeoRegression aValue bValue) =
        object [ "a" .= aValue
               , "b" .= bValue
               ]

instance ToJSON GeoScales where
    toJSON (GeoScales xRegression yRegression) =
        object [ "geoXScale" .= xRegression
               , "geoYScale" .= yRegression
               ]

getTrainingJson :: IO ByteString.ByteString
getTrainingJson =
    ByteString.readFile "./training/trainingFile.json"
    
createGeoRegression :: (GeoPoint -> Double, GeoPoint -> Double) -> [GeoPoint] -> GeoRegression
createGeoRegression (domain, range) points =
    let regression = nonRandomRobustFit defaultEstimationParameters (fromList $ map domain points) (fromList $ map range points)
        in
            GeoRegression { a = fst regression, b = snd regression }

makeGeoScales :: [GeoPoint] -> GeoScales
makeGeoScales points =
    GeoScales { geoXScale = createGeoRegression (geoX, lng) points
              , geoYScale = createGeoRegression (geoY, lat) points
              }

main :: IO ()
main = do
    jsonData <- (eitherDecode <$> getTrainingJson) :: IO (Either String [GeoPoint])
    case jsonData of
        Left err     -> putStrLn err
        Right points -> ByteString.writeFile "./training/scales.json" (encodePretty $ makeGeoScales points)
