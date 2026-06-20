from pydantic import BaseModel
from typing import Optional


class ExoplanetInput(BaseModel):
    n_stars: Optional[float] = None
    n_planets: Optional[float] = None

    orbital_period_days: Optional[float] = None
    planet_radius_earth: Optional[float] = None
    planet_mass_earth: Optional[float] = None
    equilibrium_temp_k: Optional[float] = None
    orbital_eccentricity: Optional[float] = None
    semi_major_axis_au: Optional[float] = None

    star_temp_k: Optional[float] = None
    star_radius_sun: Optional[float] = None
    star_mass_sun: Optional[float] = None
    star_age_gyr: Optional[float] = None
    star_surface_gravity: Optional[float] = None
    star_metallicity: Optional[float] = None

    dist_from_earth_pc: Optional[float] = None