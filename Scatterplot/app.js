async function draw() {
  // Data
  const dataset = await d3.json('data.json')
  const xAccessor = d => d.currently.humidity
  const yAccessor = d => d.currently.apparentTemperature

  // Dimensions 
  let dimensions = {
    width: 800,
    height: 800,
    margin: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    }
  }

  // Container width & height
  dimensions.containerWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
  dimensions.containerHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

  // Draw Image
  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', dimensions.width)
    .attr('height', dimensions.height)

  const container = svg.append('g')
    .attr(
      'transform',
      `translate(${dimensions.margin.left}, ${dimensions.margin.top})`
    )

  const tooltip = d3.select('#tooltip')

  // Scales
  const xScale = d3.scaleLinear()
    .domain(d3.extent(dataset, xAccessor))
    // .range([0, dimensions.containerWidth])
    .rangeRound([0, dimensions.containerWidth]) // .rangeRound applies to output range
    .clamp(true)

  const yScale = d3.scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    // .range([0, dimensions.containerHeight])
    .rangeRound([dimensions.containerHeight, 0]) // flips the y-axis so low values at bottom
    .nice() // .nice rounds the domain. 
    .clamp(true)

  // Draw Circles
  container.selectAll('cirlce')
    .data(dataset)
    .join('circle')
    .attr('cx', d => xScale(xAccessor(d)))
    .attr('cy', d => yScale(yAccessor(d)))
    .attr('r', 5)
    .attr('fill', 'red')
    .attr('data-temp', yAccessor)


  // Axes
  const xAxis = d3.axisBottom(xScale)
    .ticks(5)
    .tickFormat((d) => d * 100 + '%')
  // .tickValues([0.4, 0.5, 0.8]) set custom tick values
  const yAxis = d3.axisLeft(yScale)

  // Axis should be drawn in a seperate group from the data
  const xAxisGroup = container.append('g')
    .call(xAxis)
    .style('transform', `translateY(${dimensions.containerHeight}px)`)
    .classed('axis', true)

  xAxisGroup.append('text')
    .attr('x', dimensions.containerWidth / 2)
    .attr('y', dimensions.margin.bottom - 10)
    .attr('fill', 'black')
    .text('Humidity')

  const yAxisGroup = container.append('g')
    .call(yAxis)
    .classed('axis', true)

  yAxisGroup.append('text')
    .attr('x', -dimensions.containerHeight / 2)
    .attr('y', -dimensions.margin.left + 15)
    .attr('fill', 'black')
    .html('Temperature &deg; F')
    .style('transform', 'rotate(270deg)')
    .style('text-anchor', 'middle')


  const delaunay = d3.Delaunay.from(
    dataset,
    (d) => xScale(xAccessor(d)),
    (d) => yScale(yAccessor(d))
  )

  const voronoi = delaunay.voronoi()
  voronoi.xmax = dimensions.containerWidth
  voronoi.ymax = dimensions.containerHeight
  console.log(voronoi)

  container.append('g')
    .selectAll('path')
    .data(dataset)
    .join('path')
    //.attr('stroke', 'black') // remove stroke for clarity
    .attr('fill', 'transparent')
    .attr('d', (d, i) => voronoi.renderCell(i))
    .on('mouseenter', function (e, datum) {
      container.append('circle')
        .classed('dot-hovered', true)
        .attr('fill', 'purple')
        .attr('r', 8)
        .attr('cx', d => xScale(xAccessor(datum)))
        .attr('cy', d => yScale(yAccessor(datum)))
        .style('pointer-events', 'none')

      tooltip.style('display', 'block')
        .style('top', yScale(yAccessor(datum)) - 25 + "px")
        .style('left', xScale(xAccessor(datum)) + "px")

      const formatter = d3.format('.2f')
      const dateFormatter = d3.timeFormat('%B %-d, %Y')

      tooltip.select('.metric-humidity span')
        .text(formatter(xAccessor(datum)))

      tooltip.select('.metric-temp span')
        .text(formatter(yAccessor(datum)))

      tooltip.select('.metric-date')
        .text(dateFormatter(datum.currently.time * 1000))
    })
    .on('mouseleave', function (e) {
      container.select('.dot-hovered').remove()

      tooltip.style('display', 'none')
    })
}

draw()