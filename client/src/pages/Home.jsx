import React from 'react';
import Hero from '../components/Home/Hero/Hero';
import About from '../components/Home/About/About';
import Stats from '../components/Home/Stats/Stats';
import Modalidades from '../components/Home/Modalidades/Modalidades';
import News from '../components/Home/News/News';
import Contact from '../components/Home/Contact/Contact';
import Partners from '../components/Home/Partners/Partners';

const Home = () => {
  return (
    <div className="home">
      <Hero />
      <About />
      <Stats />
      <Modalidades />
      <News />
      <Contact />
      <Partners />
    </div>
  );
};

export default Home;
